import { DisposeCallback } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { hookStateCtrlKey } from "./hook-lib";

let nextId=0;

export class HookCtrl{

    public readonly id=++nextId;

    public readonly state:Record<string|symbol,any>;

    private readonly _onStateChange=new Subject<(string|symbol)[]|null>();
    /**
     * Occurs when properties of the state change. The names of the changed properties are passed
     * or null if all properties should be considered changed.
     */
    public get onStateChange():Observable<(string|symbol)[]|null>{return this._onStateChange}

    private readonly proxy:{revoke:DisposeCallback};

    public constructor()
    {
        const state:Record<string|symbol,any>={};
        state[hookStateCtrlKey]=this;
        const proxy=Proxy.revocable(state,{
            set:(target,prop,newValue,receiver)=>{
                if(state[prop]!==newValue){
                    this.queueChange(prop);
                }
                return Reflect.set(target,prop,newValue,receiver);
            },
            deleteProperty:(target,prop)=>{
                if(state[prop]!==undefined){
                    this.queueChange(prop);
                }
                return Reflect.deleteProperty(target,prop);
            },
        })
        this.state=proxy.proxy;
        this.proxy=proxy;
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.proxy.revoke();
    }

    private queueIv:any;
    private changeQueue:(string|symbol)[]=[];
    public queueChange(propName?:string|symbol)
    {
        if(propName && this.changeQueue.includes(propName)){
            return;
        }
        clearTimeout(this.queueIv);
        this.queueIv=setTimeout(()=>{
            const q=this.changeQueue;
            this.changeQueue=[];
            this._onStateChange.next(q);
        },1);

    }

    /**
     * Copies all of the properties from the props param to the state of the controller. Properties
     * with an undefined value will be deleted form the state of the controller.
     */
    public mergeState(props:Record<string,any>){
        const changed:string[]=[];

        for(const e in props){
            const v=props[e];
            if(this.state[e]===v){
                continue;
            }
            changed.push(e);
            if(v===undefined){
                delete this.state[e];
            }else{
                this.state[e]=v;
            }
        }

        return changed;
    }

    /**
     * Replaces the current state with the given state.
     */
    public stateState(state:Record<string,any>){
        for(const e in this.state){
            delete this.state[e];
        }
        for(const e in state){
            const v=state[e];
            if(v!==undefined){
                state[e]=v;
            }
        }
    }

    /**
     * Sets a single property of the state.
     */
    public stateStateProp(propName:string,value:any){
        if(this.state[propName]===value){
            return false;
        }
        this.state[propName]=value;
        return true;
    }

    /**
     * Triggers a state change
     */
    public triggerStateChange(changed:(string|symbol)[]|null=null)
    {
        this._onStateChange.next(changed);
    }
}
