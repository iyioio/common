import { ZodError, ZodSchema } from "zod";
import { HttpMethod } from "./http-types";

export const RawFnFlag=Symbol('RawFnFlag');

/**
 * Used to transform fn events. A common use for a ClaimsTransformer is to
 * add claims that can't fit inside a JWT.
 */
export type FnEventTransformer=(evt:FnEvent)=>Promise<void>;

export interface RawFnResult
{
    result:any;
    rawFlag:typeof RawFnFlag;
}

export type FnHandler=(eventSource:FnEvent,input:any)=>any|Promise<any>;

export interface FnBaseHandlerOptions
{
    logRequest?:boolean;
    returnsHttpResponse?:boolean;
    inputScheme?:ZodSchema;
    outputScheme?:ZodSchema;
    defaultHttpMethod?:HttpMethod;
    defaultHttpPath?:string;
    defaultQueryString?:string;
    inputProp?:string;
    inputParseProp?:string;
    httpLike?:boolean;
}

export interface FnHandlerOptions extends FnBaseHandlerOptions
{
    evt:any;
    context:any;
    handler:FnHandler;
}

export interface FnEvent
{
    sourceEvent:any;
    context:any;
    path:string;
    method:HttpMethod;
    routePath:string;
    query:Record<string,string>;
    headers:Record<string,string>;
    claims:Record<string,any>;

    /**
     * For websocket events this is the connection id of the socket
     */
    connectionId?:string;

    /**
     * Typically a user id
     */
    sub?:string;
}

export interface FnError
{
    ______FnError:true,
    errorCode:number;
    errorMessage:string;
    errorZod?:ZodError;
    errorMetadata?:any;
}

export const isFnError=(value:any):value is FnError=>{
    if(!value){
        return false;
    }
    return value['______FnError']===true;
}

export const createFnError=(code:number,message:string,zodError?:ZodError,metadata?:any):FnError=>{
    return {
        ______FnError:true,
        errorCode:code,
        errorMessage:message,
        errorZod:zodError,
        errorMetadata:metadata,
    }
}

export interface FnInvokeEvent<TInput=any>
{
    label?:string;
    ______isFnInvokeEvent:true;
    input?:TInput;
    jwt?:string;
}

export const isFnInvokeEvent=(value:any):value is FnInvokeEvent=>{
    return value?.______isFnInvokeEvent===true;
}
