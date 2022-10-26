

export const isServerSide=typeof (globalThis as any).window === 'undefined';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const unused=(...args:any[])=>{
    //do nothing
}

export const asType=<T>(value:T):T=>value;

export const delayAsync=(delayMs:number):Promise<void>=>
{
    delayMs=Math.round(delayMs);
    return new Promise((r)=>{
        if(delayMs<=0){
            r();
        }else{
            (globalThis as any).setTimeout(r,delayMs);
        }
    });
}

export const hasFlag=<T extends number>(flags:T|undefined|null, searchFlag:T):boolean=>
    flags===null || flags===undefined?false:(flags&searchFlag)===searchFlag;
