import type { ZodObject } from 'zod';

export type ConvoMessageType='text'|'function';

export const convoValueConstants=['true','false','null','undefined'] as const;
export type ConvoValueConstant=(typeof convoValueConstants)[number];

export const convoNonFuncKeywords=['in'] as const;
export type ConvoNonFuncKeyword=(typeof convoNonFuncKeywords)[number];


/**
 * Can be a text message or function definition
 */
export interface ConvoMessage
{
    role?:string;
    content?:string;
    statement?:ConvoStatement;
    fn?:ConvoFunction;

}

export interface ConvoStatement
{
    /**
     * Raw value
     */
    value?:any;

    /**
     * name of function to invoke
     */
    fn?:string;

    /**
     * Args to pass to fn if defined
     */
    params?:ConvoStatement[];

    /**
     * Name of a variable to set the function call result or value to.
     */
    set?:string;

    /**
     * Name of a referenced variable
     */
    varRef?:string;

    /**
     * Label optional - If true the statement is option. Used in com
     */
    opt?:boolean;

    /**
     * Statement label
     */
    label?:string;

    /**
     * Name of a non function keyword
     */
    keyword?:string;

    comment?:string;
}

export interface ConvoFunction
{
    name:string;
    scope?:string;
    description?:string;
    paramsType?:ZodObject<any>;
    body:ConvoStatement[];
    params:ConvoStatement[];
    paramsName?:string;
}

export interface ConvoParsingResult
{
    messages:ConvoMessage[];
    error?:ConvoParsingError;
    endIndex:number;
}

export interface ConvoParsingError
{
    message:string;
    index:number;
    lineNumber:number;
    line:string;
    near:string;
}
