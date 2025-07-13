import { ZodSchema } from 'zod';
import { getErrorMessage } from './error-lib';
import { BadRequestError, BaseError } from './errors';
import { FnBaseHandlerOptions, FnEvent, FnHandler, FnHandlerOptions, RawFnFlag, RawFnResult, createFnError, isFnInvokeEvent } from './fn-handler-types';
import { FnEventTransformers } from './fn-handler.deps';
import { createHttpBadRequestResponse, createHttpErrorResponse, createHttpJsonResponse, createHttpNoContentResponse, createHttpNotFoundResponse, createHttpStringResponse } from './http-server-lib';
import { HttpResponseOptions } from './http-server-types';
import { HttpMethod } from './http-types';
import { parseJwt } from './jwt';
import { validateJwt } from './jwt-lib';
import { getObjKeyCount, queryParamsToObjectJson } from './object';
import { isZodArray, valueIsZodBoolean, valueIsZodNumber, valueIsZodObject, valueIsZodString, zodCoerceObject } from './zod-helpers';

export const fnHandler=async (options:FnHandlerOptions)=>{

    let routePath='/';
    let responseDefaults:HttpResponseOptions|undefined;
    let isHttp=true;

    try{

        const {
            evt,
            context,
            handler,
            logRequest,
            returnsHttpResponse,
            inputScheme,
            outputScheme,
            httpLike,
            defaultHttpMethod=httpLike?'POST':undefined,
            defaultHttpPath=httpLike?'/':undefined,
            defaultQueryString,
            inputProp,
            inputParseProp=httpLike?'body':undefined,
            allowParallelInvoke,
        }=options;

        let {
            inputOverride
        }=options;

        if(logRequest){
            console.info('serverlessHandler',evt);
        }

        const eventRecords:any[]|undefined=(
            evt.Records &&
            Array.isArray(evt.Records) &&
            (inputProp?evt[inputProp]===undefined:true) &&
            (inputParseProp?evt[inputParseProp]===undefined:true)?
            evt.Records:undefined
        );


        if(eventRecords){

            if(inputScheme && !isZodArray(inputScheme)){
                if(allowParallelInvoke){
                    await Promise.all(eventRecords.map(e=>fnHandler({...options,evt:e,inputParseProp:inputParseProp??'body'})))
                }else{
                    for(const e of eventRecords){
                        await fnHandler({...options,evt:e,inputParseProp:inputParseProp??'body'});
                    }
                }
                return undefined;
            }

            if(inputOverride===undefined){
                inputOverride=eventRecords.map(v=>{
                    let input=inputProp?v[inputProp]:undefined;
                    if(input!==undefined){
                        return input;
                    }

                    input=inputParseProp?v[inputParseProp]:undefined;
                    if(input!==undefined){
                        return (typeof input === 'string')?
                            parseJson(input):
                            input;
                    }

                    input=v.body??v.Body;
                    if(typeof input === 'string'){
                        try{
                            return parseJson(input)
                        }catch{
                            return input;
                        }
                    }
                    return input;
                });
            }
        }

        const fnInvokeEvent=isFnInvokeEvent(evt)?evt:undefined;

        const requestContextHttpPath=evt?.requestContext?.http?.path;
        const requestContextHttpMethod=evt?.requestContext?.http?.method;
        const requestContextPath=evt?.requestContext?.path??evt?.path??defaultHttpPath;
        const requestContextMethod=evt?.requestContext?.httpMethod??evt?.httpMethod??defaultHttpMethod;

        const query=getQuery(evt,defaultQueryString);

        let path=(
            (requestContextHttpPath)??
            (requestContextPath)??
            '/'
        )
        const method=(
            requestContextHttpMethod??
            requestContextMethod??
            'POST'
        )?.toUpperCase() as HttpMethod;

        if(!path.startsWith('/')){
            path='/'+path;
        }

        isHttp=(
            (requestContextHttpPath!==undefined && requestContextHttpMethod!==undefined) ||
            (requestContextPath!==undefined && requestContextMethod!==undefined)
        )
        const isApiGateway=!!requestContextMethod;
        //const isLambdaUrl=!!requestContextHttpMethod;
        const cors=isApiGateway;
        responseDefaults={cors};

        let input=(
            inputOverride!==undefined?
                inputOverride
            :inputProp?
                evt[inputProp]
            :inputParseProp?
                (typeof evt[inputParseProp]==='string')?parseJson(evt[inputParseProp]):undefined
            :fnInvokeEvent?
                fnInvokeEvent.input
            :isHttp?
                (evt.body?
                    (typeof evt.body === 'string')?
                        parseJson(evt.body)
                    :
                        evt.body
                :((method==='GET' || getObjKeyCount(query)) && inputScheme)?
                    parseQuery(inputScheme,query)
                :
                    undefined
                )
            :
                evt
        );

        if(inputScheme){
            const parsed=inputScheme.safeParse(input);
            if(parsed.success){
                input=parsed.data;
            }else if(parsed.success===false){
                if(logRequest){
                    console.error('serverlessHandler - Invalid input',input);
                }
                if(isHttp){
                    return createHttpBadRequestResponse(parsed.error.message);
                }else{
                    return createFnError(400,parsed.error.message,parsed.error);
                }
            }
        }

        routePath=`${method}:${path}`;

        let sub:string|undefined=undefined;
        let claims:Record<string,any>={};

        if(fnInvokeEvent?.jwt){
            if(!validateJwt(fnInvokeEvent.jwt)){
                console.error('RouteHandler received an invalid JWT or the the JWT was unable to be validated.');
                if(isHttp){
                    return createHttpBadRequestResponse('Invalid JWT',responseDefaults);
                }else{
                    return createFnError(400,'Invalid JWT');
                }
            }
            claims=parseJwt(fnInvokeEvent.jwt)??{};
            sub=claims['sub'];
        }

        const headers:Record<string,string>=evt.headers??{};
        const remoteAddress:string|undefined=headers['x-forwarded-for'];

        const fnEvent:FnEvent={
            sourceEvent:evt,
            context,
            path,
            method,
            routePath,
            query,
            headers,
            claims,
            sub,
            responseDefaults,
        }

        if(fnInvokeEvent?.apiKey){
            fnEvent.apiKey=fnInvokeEvent.apiKey;
        }

        if(typeof remoteAddress === 'string'){
            fnEvent.remoteAddress=remoteAddress;
        }

        if(typeof evt.requestContext?.connectionId === 'string'){
            fnEvent.connectionId=evt.requestContext.connectionId;
        }

        if(typeof evt.requestContext?.eventType === 'string'){
            fnEvent.eventType=evt.requestContext.eventType;
        }

        const transformers=FnEventTransformers.all();
        for(const t of transformers){
            await t(fnEvent);
        }


        if(method==='OPTIONS'){
            if(isHttp){
                return createHttpNoContentResponse(responseDefaults);
            }
        }
        let result=await handler(fnEvent,input);

        if(isRawFnResult(result)){
            return result.result;
        }

        if(outputScheme){
            const parsed=outputScheme.safeParse(result);
            if(parsed.success){
                result=parsed.data;
            }else if(parsed.success===false){
                console.error(`handler result does does not match output scheme.`,parsed.error);
                if(isHttp){
                    return createHttpErrorResponse('Internal server error - invalid return data',responseDefaults);
                }else{
                    return createFnError(500,'Internal server error - invalid return data');
                }
            }
        }

        if(isHttp){
            if(result===null){
                return createHttpNotFoundResponse('Resource not found',responseDefaults);
            }else if(result===undefined){
                return createHttpNoContentResponse(responseDefaults);
            }else if(returnsHttpResponse){
                return result;
            }else{
                return createHttpJsonResponse(result,responseDefaults);
            }
        }else{
            return result;
        }
    }catch(ex){
        let logError=true;
        let code=500;
        let message='Internal server error';
        if(ex instanceof BaseError){
            logError=ex.cErrT<400 || ex.cErrT>499;
            code=ex.cErrT;
            message=ex.message;
        }
        if(logError){
            console.error(`RouteHandler failed. path=${routePath}`,ex);
        }
        if(isHttp){
            return createHttpStringResponse(code,message,responseDefaults);
        }else{
            return createFnError(code,message);
        }
    }
}

const parseJson=<T=any>(value:string):T=>{
    try{
        return JSON.parse(value);
    }catch(ex){
        throw new BadRequestError('Invalid JSON body - '+getErrorMessage(ex));
    }
}

const getQuery=(evt?:any,defaultQueryString?:string):Record<string,any>=>{
    const _queryString=evt?.rawQueryString??defaultQueryString;
    if(_queryString!==undefined){
        return queryParamsToObjectJson(_queryString);
    }else if(evt?.queryStringParameters){
        return queryParamsToObjectJson(evt?.queryStringParameters);
    }else{
        return {}
    }
}

export const createFnHandler=(handler:FnHandler,options:FnBaseHandlerOptions={}):((evt:any,context:any)=>Promise<any>) & {rawHandler:FnHandler}=>{
    const handlerProxy=(evt:any,context:any)=>fnHandler({
        ...options,
        handler,
        evt,
        context,
    });

    handlerProxy.rawHandler=handler;

    return handlerProxy;
}

export const isRawFnResult=(value:any): value is RawFnResult=>{
    if(!value){
        return false;
    }
    return (value as RawFnResult).rawFlag===RawFnFlag;
}

export const createRawFnResult=(result:any):RawFnResult=>{
    return {
        result,
        rawFlag:RawFnFlag
    }
}

export const createEmptyEventSource=():FnEvent=>({
    sourceEvent:{},
    context:{},
    path:'/',
    method:'GET',
    routePath:'/',
    query:{},
    headers:{},
    claims:{},
})

const parseQuery=(inputScheme:ZodSchema,query:Record<string,any>)=>{
    if(query['__input']!==undefined){
        if(valueIsZodObject(inputScheme)){
            for(const e in inputScheme.shape){
                query={[e]:query['__input']??''};
                break;
            }
        }else if(valueIsZodString(inputScheme)){
            return query['__input'];
        }else if(valueIsZodNumber(inputScheme)){
            return Number(query['__input']);
        }else if(valueIsZodBoolean(inputScheme)){
            return query['__input']===''?true:Boolean(query['__input']);
        }
    }
    return zodCoerceObject(inputScheme,query)?.result;
}
