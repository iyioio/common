import { EmptyFunction } from "./common-types";


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

export const emptyFunction:EmptyFunction=()=>{
    // do nothing;
}

export const nameToEnvName=(name:string)=>name?name.replace(/[A-Z]+/g,m=>'_'+m).replace(/__+/g,'_').toUpperCase():'';

export const isPromise=<T=any>(value:any):value is Promise<T>=>(
    (typeof (value as Partial<Promise<T>>)?.then === 'function') &&
    (typeof (value as Partial<Promise<T>>)?.catch === 'function') &&
    (typeof (value as Partial<Promise<T>>)?.finally === 'function')
)?true:false;
