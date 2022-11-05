export type PromiseStatus='waiting'|'resolved'|'rejected';

export interface PromiseSource<T>
{
    readonly promise:Promise<T>;
    readonly getStatus:()=>PromiseStatus;
    readonly resolve:(value:T|PromiseLike<T>)=>void;
    readonly reject:(reason:any)=>void;
}

export const createPromiseSource=<T>():PromiseSource<T>=>
{
    let resolve:any;
    let reject:any;
    let status:PromiseStatus='waiting';
    const promise=new Promise<T>((r,j)=>{
        resolve=r;
        reject=j;
    })
    return {
        promise,
        getStatus:()=>status,
        resolve:r=>{
            status='resolved';
            resolve(r);
        },
        reject:j=>{
            status='rejected';
            reject(j);
        }
    }
}
