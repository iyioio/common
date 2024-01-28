import { DisposeCallback } from "./common-types";

const allRefs:ResourceRef<any>[]=[];
try{
    if(globalThis.window){
        (globalThis.window as any).___IYIO_ALL_RESOURCE_REFS___=allRefs;
    }
}catch{/* */}

export interface ResourceRefOptions<T>
{
    dispose?:(value:T)=>void;

    disposeDelayMs?:number;

    autoDispose?:(value:T)=>boolean;

    /**
     * Number of seconds in between checking if the source should be disposed. Checking interval is
     * approximate and has a maximum resolution of 5 seconds.
     * @default 5
     */
    autoDisposeIntervalSec?:number;

    initRefCount?:number;
}

/**
 * A ResourceRef if an object that tracks references to a resources. For example a ResourceRef can
 * be used to free a URL created by URL.createObjectURL when no longer needed.
 */
export class ResourceRef<T>
{
    /**
     * The referenced value
     */
    public readonly value:T;

    /**
     * What the value is used for. This can be used to debug issues with the usage of the resource.
     * Sensitive data should not be stored in usage
     */
    public readonly usage:string;

    /**
     * Callback responsible for disposing of the resource.
     */
    private readonly disposeCallback?:(value:T)=>void;

    /**
     * Number of milliseconds to wait dispose of the resource after no references.
     */
    public readonly disposeDelayMs:number;

    /**
     * Timestamp when the resource ref was created.
     */
    public readonly created:number;

    /**
     * If defined autoDispose will be called periodically to check if the resource is ready to be
     * disposed of. Both autoDispose must return true and refCount be zero in-order for the
     * resource to be disposed of. autoDispose is only called when refCount is zero.
     */
    private readonly autoDispose?:(value:T)=>boolean;

    public constructor(usage:string, value:T, options?:ResourceRefOptions<T>)
    {
        this.created=Date.now();
        this.value=value;
        this.usage=usage;
        this._refCount=options?.initRefCount??0;
        this.disposeCallback=options?.dispose;
        this.disposeDelayMs=options?.disposeDelayMs??0;
        this.autoDispose=options?.autoDispose;
        allRefs.push(this);
        if(this.autoDispose){
            addAuto({
                res:this,
                iv:(options?.autoDisposeIntervalSec??5)*1000,
                lastCheck:0,
                dispose:()=>this.dispose()
            });
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    private dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        const i=allRefs.indexOf(this);
        if(i!==-1){
            allRefs.splice(i,1);
        }
        if(this.disposeCallback){
            try{
                this.disposeCallback(this.value);
            }catch(ex){
                console.error(`ResourceRef dispose callback failed. usage = ${this.usage}`,ex);
            }
        }
    }

    private tryDispose()
    {
        if(this.disposeDelayMs<=0){
            this.dispose();
            return;
        }
        setTimeout(()=>{
            if(this._refCount===0){
                this.dispose();
            }
        },this.disposeDelayMs)
    }


    private _refCount;
    public get refCount(){return this._refCount}
    public addRef(){
        this._refCount++;
    }

    public removeRef()
    {
        if(this._refCount<0){
            const msg=`ResourceRef ref count already at 0 when trying to remove ref. usage = ${this.usage}`;
            console.error(msg);
            throw new Error(msg)

        }
        this._refCount--;

        if(this.shouldDispose()){
            this.tryDispose();
        }
    }

    public shouldDispose(){
        if(this.refCount>0){
            return false;
        }
        if(!this.autoDispose){
            return true;
        }
        try{
            return this.autoDispose(this.value);
        }catch(ex){
            console.error(`auto dispose check failed. Resource will be disposed. usage = ${this.usage}`,ex);
            return true;
        }
    }
}

interface Auto
{
    res:ResourceRef<any>;
    dispose:DisposeCallback;
    lastCheck:number;
    iv:number;
}

let autoIv:any=null;
const autos:Auto[]=[];
const addAuto=(auto:Auto)=>{
    autos.push(auto);
    if(autos.length===1){
        startAutoInterval();
    }
}

const startAutoInterval=()=>{
    clearInterval(autoIv);
    autoIv=setInterval(()=>{
        const now=Date.now();
        for(let i=0;i<autos.length;i++){
            const auto=autos[i];
            if(!auto){
                continue;
            }
            if(auto.lastCheck+auto.iv<now){
                auto.lastCheck=now;
                if(auto.res.shouldDispose()){
                    autos.splice(i,1);
                    i--;
                    auto.dispose();
                }
            }
        }
        if(!autos.length){
            clearInterval(autoIv);
        }
    },5000)
}
