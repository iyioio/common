import type { BehaviorSubject } from "rxjs";

export interface IProgress
{
    readonly id:number;
    readonly name:string;
    readonly items?:readonly IProgress[];
    readonly statusSubject:BehaviorSubject<string>;
    readonly status:string;
    readonly progressSubject:BehaviorSubject<number>;
    readonly progress:number;
    get():number;
    set(value:number, status?:string|null):number;
}

export interface ProgressSummary
{
    readonly id:number;
    readonly name:string;
    readonly status:string;
    readonly progress:number;
    readonly items?:ProgressSummary[];
}
