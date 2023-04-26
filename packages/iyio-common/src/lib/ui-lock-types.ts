import { BehaviorSubject } from "rxjs";
import { IProgress } from "./progress-types";

export interface UiLockContainer
{
    readonly locksSubject:BehaviorSubject<UiLock[]>;
}

export interface UiLock
{
    id:number;
    active:boolean;
    message:string;
    progress:IProgress|null;
}

export interface UiLockHandle
{
    lock:(message:string,progress?:IProgress|null)=>()=>void;
    get:<T>(message:string,asyncWork:()=>Promise<T>)=>Promise<{result:T|null,success:boolean,error:any}>;
    run:<T>(message:string,asyncWork:()=>Promise<T>)=>void;

    getWithProgress:<T>(message:string,progress:IProgress|null|undefined,asyncWork:()=>Promise<T>)=>Promise<{result:T|null,success:boolean,error:any}>;
    runWithProgress:<T>(message:string,progress:IProgress|null|undefined,asyncWork:()=>Promise<T>)=>void;
}
