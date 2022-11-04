
export interface PromiseSource<T>
{
    promise:Promise<T>;
    resolve:(value:T|PromiseLike<T>)=>void;
    reject:(reason:any)=>void;
}

export const createPromiseSource=<T>():PromiseSource<T>=>
{
    let resolve:any;
    let reject:any;
    const promise=new Promise<T>((r,j)=>{
        resolve=r;
        reject=j;
    })
    return {
        promise,
        resolve:resolve as (value:T|PromiseLike<T>)=>void,
        reject:reject as (reason:any)=>void
    }
}
