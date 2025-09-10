import { DisposeCallback, IDisposable, IOpDisposable, ISubscription } from "./common-types.js";

export class DisposeContainer implements IDisposable
{
    private _isDisposing=false;
    public get isDisposing(){return this._isDisposing}

    private readonly subs:ISubscription[]=[];

    private readonly cbs:DisposeCallback[]=[];

    private readonly disposables:IDisposable[]=[];

    public add(disposable:IOpDisposable):DisposeContainer
    {
        if(!disposable.dispose){
            return this;
        }
        if(this._isDisposing){
            try{
                disposable.dispose?.();
            }catch(ex){
                console.warn('Dispose failed',ex);
            }
            return this;
        }
        this.disposables.push(disposable as IDisposable);
        return this;
    }

    public addSub(sub:ISubscription):DisposeContainer
    {
        if(this._isDisposing){
            try{
                sub.unsubscribe();
            }catch(ex){
                console.warn('Unsubscribe failed',ex);
            }
            return this;
        }
        this.subs.push(sub);
        return this;
    }

    public createSub(create:()=>ISubscription|null|undefined)
    {
        if(this._isDisposing){
            return;
        }
        const sub=create();
        if(!sub){
            return;
        }
        this.addSub(sub);
    }

    public addCb(cb:DisposeCallback):DisposeContainer
    {
        if(this._isDisposing){
            try{
                cb();
            }catch(ex){
                console.warn('Dispose callback failed',ex);
            }
            return this;
        }
        this.cbs.push(cb);
        return this;
    }

    public createCb(create:()=>DisposeCallback|null|undefined)
    {
        if(this._isDisposing){
            return;
        }
        const cb=create();
        if(!cb){
            return;
        }
        this.addCb(cb);
    }

    public dispose()
    {
        if(this._isDisposing){
            return;
        }
        this._isDisposing=true;
        for(const sub of this.subs){
            try{
                sub.unsubscribe();
            }catch(ex){
                console.warn('Unsubscribe failed',ex);
            }
        }
        for(const cb of this.cbs){
            try{
                cb();
            }catch(ex){
                console.warn('Dispose callback failed',ex);
            }
        }
        for(const d of this.disposables){
            try{
                d.dispose();
            }catch(ex){
                console.warn('Dispose failed',ex);
            }
        }

    }
}
