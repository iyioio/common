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

export interface CodeParsingOptions
{
    startIndex?:number;
    parseMarkdown?:boolean;
    debug?:(...args:any[])=>void;
}

export type CodeParser<T=any,TOptions extends CodeParsingOptions=CodeParsingOptions>=(code:string,options?:TOptions)=>CodeParsingResult<T>;
