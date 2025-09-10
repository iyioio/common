import { ZodError, ZodSchema } from "zod";
import { HttpResponseOptions } from "./http-server-types.js";
import { HttpMethod } from "./http-types.js";

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
    allowParallelInvoke?:boolean;
    inputOverride?:any;
}

export interface FnHandlerOptions extends FnBaseHandlerOptions
{
    evt:any;
    context:any;
    handler:FnHandler;
}

export const FnEventEventTypeConnect="CONNECT";
export const FnEventEventTypeMessage="MESSAGE";
export const FnEventEventTypeDisconnect="DISCONNECT";

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
    responseDefaults?:HttpResponseOptions;

    /**
     * In most cases this is the remote IP address of the calling client
     */
    remoteAddress?:string;

    /**
     * For websocket events this is the connection id of the socket
     */
    connectionId?:string;

    /**
     * For websocket events this is either CONNECT, MESSAGE or DISCONNECT
     * @see https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-mapping-template-reference.html
     */
    eventType?:string;

    /**
     * Typically a user id
     */
    sub?:string;

    apiKey?:string;
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
    apiKey?:string;
}

export const isFnInvokeEvent=(value:any):value is FnInvokeEvent=>{
    return value?.______isFnInvokeEvent===true;
}
