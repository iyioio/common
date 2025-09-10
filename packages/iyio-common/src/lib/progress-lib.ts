import { BehaviorSubject, Subscription } from "rxjs";
import { IProgress, ProgressSummary } from "./progress-types.js";

let nextId=1;

export class Progress implements IProgress
{

    public readonly id:number;

    public readonly name:string;

    public readonly statusSubject=new BehaviorSubject('');
    public get status(){return this.statusSubject.value}

    public readonly progressSubject=new BehaviorSubject(0);
    public get progress(){return this.progressSubject.value}

    public constructor(name:string, initStatus:string='', initValue:number=0){
        this.id=nextId++;
        this.name=name;

        if(initStatus){
            this.statusSubject.next(initStatus);
        }

        if(initValue){
            this.progressSubject.next(initValue);
        }
    }

    public get(){
        return this.progressSubject.value;
    }

    public set(value: number, status?:string|null){
        if(status){
            this.statusSubject.next(status);
        }
        this.progressSubject.next(value);
        return this.progressSubject.value;
    }
}

export class ProgressGroup extends Progress
{

    private _items:readonly IProgress[]=[];
    public get items(){return this._items}

    public add(name:string, initStatus:string='', initValue:number=0):IProgress
    {
        const item=new Progress(name,initStatus,initValue);
        return this.addItem(item);
    }

    private readonly subs:SubPair[]=[];
    public addItem(item:IProgress):IProgress
    {
        this._items=Object.freeze([...this._items,item]);
        this.subs.push({
            subscription:item.progressSubject.subscribe(this.onSubProgress),
            progress:item
        })
        this.updateProgress();
        return item;
    }

    public remove(itemOrName:string|IProgress)
    {
        const removed=this._remove(itemOrName);
        if(removed){
            this.updateProgress();
        }
        return removed;
    }

    private _remove(itemOrName:string|IProgress)
    {
        let item:IProgress|null;
        if(typeof itemOrName === 'string'){
            item=this._items.find(s=>s.name===itemOrName)||null;
        }else{
            item=itemOrName;
        }
        if(!item || !this._items.includes(item)){
            return null;
        }
        const pi=this.subs.findIndex(s=>s.progress===item);
        if(pi){
            this.subs[pi]?.subscription.unsubscribe();
            this.subs.splice(pi,1);
        }
        this._items=Object.freeze(this._items.filter(s=>s!==item));
        return item;
    }

    public clear(status:string=''):number
    {
        let count=0;
        const items=[...this._items];
        for(const i of items){
            if(this._remove(i)){
                count++;
            }
        }
        this.progressSubject.next(0);
        this.statusSubject.next(status);
        return count;
    }

    private readonly onSubProgress=()=>{
        this.updateProgress();
    }

    private updateProgress(){
        let total=0;
        for(const sub of this._items){
            total+=sub.progress;
        }
        this.progressSubject.next(total/this._items.length);
    }
}

interface SubPair{
    subscription:Subscription;
    progress:IProgress;
}

export function progressToValue(progress:IProgress|number|null|undefined)
{
    const p=progress?(typeof progress === 'number'?progress:progress.get()):0;
    return isFinite(p)?p:0;
}

export function progressToSummary(progress:IProgress): ProgressSummary
{
    return {
        id:progress.id,
        name:progress.name,
        status:progress.status,
        progress:progress.progress,
        items:progress.items?.map(p=>progressToSummary(p)),
    }
}
