import { Observable, Subject, Subscription } from "rxjs";
import { DisposeCallback } from "./common-types";

export type ProxyObjectChangeType='set'|'delete';

export type ProxyObjectChangeCallback=(evt:ProxyObjectChangeEvt)=>void;

export interface ProxyChangeDetectorOptions
{
    target:any;
    maxDepth?:number;
    listener?:ProxyObjectChangeCallback;
}

export interface ProxyObjectChangeEvt{
    type:ProxyObjectChangeType;
    rootTarget:any;
    target:any;
    prop:string|symbol;
    newValue?:any;
    receiver?:any;
}

export class ProxyChangeDetector
{
    public readonly proxy:any;
    public readonly target:any;
    public readonly maxDepth:number;
    private readonly _onChange=new Subject<ProxyObjectChangeEvt>();
    public get onChange():Observable<ProxyObjectChangeEvt>{return this._onChange}

    private readonly proxyMap:Map<any,ProxyHandle>;
    private defaultSub?:Subscription;

    public constructor({
        target,
        maxDepth=1,
        listener
    }:ProxyChangeDetectorOptions){
        this.target=target;
        this.maxDepth=maxDepth;
        this.proxyMap=new Map();
        this.proxy=this.wrap(target,1);
        if(listener){
            this.defaultSub=this._onChange.subscribe(listener);
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.defaultSub?.unsubscribe();
        const proxies=this.proxyMap.values();
        for(const p of proxies){
            p.revoke();
        }
        this.proxyMap.clear();
    }

    private wrap(target:any,depth:number):any{

        const existing=this.proxyMap.get(target);
        if(existing){
            return existing.proxy;
        }

        if(depth>this.maxDepth){
            return target;
        }

        const proxy=Proxy.revocable(target,{
            get:(target,prop,receiver)=>{
                if(this.maxDepth<2 || this._isDisposed || !target || (typeof target!=='object')){
                    return Reflect.get(target,prop,receiver);
                }
                const value=target[prop];
                if(value && (typeof value === 'object')){
                    return this.wrap(value,depth+1);
                }else{
                    return value;
                }
            },
            set:(target,prop,newValue,receiver)=>{
                if(target[prop]!==newValue && !this._isDisposed){
                    this._onChange.next({
                        type:'set',
                        target,
                        rootTarget:this.target,
                        prop,
                        newValue,
                        receiver,
                    })
                }
                return Reflect.set(target,prop,newValue,receiver);
            },
            deleteProperty:(target,prop)=>{
                if(target[prop]!==undefined && !this._isDisposed){
                    this._onChange.next({
                        type:'delete',
                        target,
                        rootTarget:this.target,
                        prop,
                    })
                }
                return Reflect.deleteProperty(target,prop);
            },

        });

        this.proxyMap.set(target,proxy);

        return proxy.proxy;
    }
}

interface ProxyHandle
{
    proxy:any;
    revoke:DisposeCallback;
}
