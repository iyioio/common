export type LazyPromiseHandler<T>=(resolve:(value:T)=>void,reject:(reason?:any)=>void)=>void;

export class LazyPromise<T> extends Promise<T>
{

    private _lazyInit?:LazyPromiseHandler<T>;
    private _lazyResolve?:(value:T)=>void;
    private _lazyReject?:(reason?:any)=>void;
    private _lazyInited?:boolean;
    private _lazyReady?:boolean;

    public constructor(init:LazyPromiseHandler<T>){
        super((resolve,reject)=>{
            this._lazyResolve=resolve;
            this._lazyReject=reject;
            this._tryLazyInit();
        })
        this._lazyInit=init;
    }

    override then<TResult1=T,TResult2=never>(
        onfulfilled?:((value:T)=>TResult1|PromiseLike<TResult1>)|null|undefined,
        onrejected?:((reason:any)=>TResult2|PromiseLike<TResult2>)|null|undefined
    ):Promise<TResult1|TResult2>{
        this._lazyReady=true;
        this._tryLazyInit();
        return super.then(onfulfilled,onrejected);
    }

    private _tryLazyInit(){
        if(this._lazyInited || !this._lazyReady){
            return;
        }
        const init=this._lazyInit;
        const resolve=this._lazyResolve;
        const reject=this._lazyReject;
        if(!init || !resolve || !reject){
            return;
        }
        this._lazyInited=true;
        delete this._lazyInit;
        delete this._lazyResolve;
        delete this._lazyReject;
        init(resolve,reject);

    }
}

export const callbackToLazyPromise=<T>(callback:()=>Promise<T>):LazyPromise<T>=>{
    return new LazyPromise(async (r,j)=>{
        try{
            r(await callback());
        }catch(ex){
            j(ex);
        }
    })
}
