export interface CodeParsingResult<T=any>
{
    result?:T;
    error?:CodeParsingError;
    endIndex:number;
}

export interface CodeParsingError
{
    message:string;
    index:number;
    lineNumber:number;
    col:number;
    line:string;
    near:string;
}

export type CodeParser<T=any>=(code:string,debug?:(...args:any[])=>void)=>CodeParsingResult<T>;
