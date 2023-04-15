import { createFnError, FnBaseHandlerOptions, FnHandler, FnHandlerOptions } from './fn-handler-types';
import { createHttpBadRequestResponse, createHttpErrorResponse, createHttpJsonResponse, createHttpNoContentResponse, createHttpNotFoundResponse } from './http-server-lib';
import { HttpMethod } from './http-types';

export const fnHandler=async ({
    evt,
    context,
    handler,
    logRequest,
    returnsHttpResponse,
    inputScheme,
    outputScheme,
}:FnHandlerOptions)=>{
    if(logRequest){
        console.info('serverlessHandler',evt);
    }
    const requestContextHttpPath=evt?.requestContext?.http?.path;
    const requestContextHttpMethod=evt?.requestContext?.http?.method;
    const requestContextPath=evt?.requestContext?.path;
    const requestContextMethod=evt?.requestContext?.httpMethod;

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

    const isHttp=(
        (requestContextHttpPath!==undefined && requestContextHttpMethod!==undefined) ||
        (requestContextPath!==undefined && requestContextMethod!==undefined)
    )
    const isApiGateway=!!requestContextMethod;
    //const isLambdaUrl=!!requestContextHttpMethod;
    const cors=isApiGateway;
    const responseDefaults={cors};

    let input=isHttp?
        (evt.body?(typeof evt.body === 'string')?JSON.parse(evt.body):evt.body:undefined):
        evt;

    if(inputScheme){
        const parsed=inputScheme.safeParse(input);
        if(parsed.success){
            input=parsed.data;
        }else if(parsed.success===false){
            if(isHttp){
                return createHttpBadRequestResponse(parsed.error.message);
            }else{
                return createFnError(400,parsed.error.message,parsed.error);
            }
        }
    }

    const routePath=`${method}:${path}`;

    try{
        if(method==='OPTIONS'){
            if(isHttp){
                return createHttpNoContentResponse(responseDefaults);
            }
        }
        let result=await handler({
            sourceEvent:evt,
            context,
            path,
            method,
            routePath,
        },input);

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
        console.error(`RouteHandler failed. path=${routePath}`,ex);
        if(isHttp){
            return createHttpErrorResponse('Internal server error',responseDefaults);
        }else{
            return createFnError(500,'Internal server error');
        }
    }
}

export const createFnHandler=(handler:FnHandler,options:FnBaseHandlerOptions={}):((evt:any,context:any)=>Promise<any>)=>{
    return (evt:any,context:any)=>fnHandler({
        ...options,
        handler,
        evt,
        context,
    });
}
