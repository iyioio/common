

export const isServerSide=typeof (globalThis as any).window === 'undefined';

export const breakFunction=Symbol('breakFunction');
export type BreakFunction=typeof breakFunction;
export const continueFunction=Symbol('continueFunction');
export type ContinueFunction=typeof continueFunction;
export type FunctionLoopControl=BreakFunction|ContinueFunction;
export const shouldBreakFunction=(value:any)=>value===breakFunction || value===false;

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


export const parseConfigBool=(value:string|null|undefined)=>{
    if(!value){
        return false;
    }
    value=value.toLowerCase();
    return value==='true' || value==='yes' || value==='1';
}
