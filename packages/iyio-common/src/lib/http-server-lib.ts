import { HashMap } from "./common-types";
import { HttpRequestEventVariations, HttpResponse, HttpResponseOptions, RouteConfig, RouteMap } from "./http-server-types";
import { HttpMethod } from "./http-types";
import { deleteUndefined } from "./object";



const _defaultRouteConfig:RouteConfig={};

export const defaultCorsHeaders=Object.freeze({
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"*",
    "Access-Control-Allow-Methods":"OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD",
    "Access-Control-Max-Age":"86400",
    "Access-Control-Allow-Credentials":"true",
})

const emptyObject={}

let defaultServerName='iyio';
export const setDefaultHttpServerName=(name:string)=>{
    defaultServerName=name;
}

export const createHttpResponse=({
    statusCode=200,
    headers=emptyObject,
    serverName=defaultServerName,
    cors,
    contentType,
    body,
}:HttpResponseOptions):HttpResponse=>(deleteUndefined({
    statusCode,
    headers: deleteUndefined({
        ...(cors?defaultCorsHeaders:emptyObject),
        "Content-Type": contentType??(body?"application/json":undefined),
        Server: serverName,
        ...headers
    }) as HashMap<string>,
    body,
}))

export const createHttpJsonResponse=(body:any,options:HttpResponseOptions=emptyObject)=>createHttpResponse({
    ...options,
    body:JSON.stringify(body)
})

export const createHttpNoContentResponse=(options:HttpResponseOptions=emptyObject)=>createHttpResponse({
    ...options,
    statusCode:204,
})

export const createHttpRedirectResponse=(location:string,options:HttpResponseOptions=emptyObject)=>createHttpResponse({
    ...options,
    headers:{
        ...(options.headers??{}),
        location,
    },
    statusCode:301,
})

export const createHttpNotFoundResponse=(message:string,options:HttpResponseOptions=emptyObject)=>createHttpResponse({
    ...options,
    statusCode:404,
    body:JSON.stringify(message)
})

export const createHttpBadRequestResponse=(message:string,options:HttpResponseOptions=emptyObject)=>createHttpResponse({
    ...options,
    statusCode:400,
    body:JSON.stringify(message)
})

export const createHttpErrorResponse=(message:string,options:HttpResponseOptions=emptyObject,statusCode=500)=>createHttpResponse({
    ...options,
    statusCode,
    body:JSON.stringify(message)
})

export const createHttpStringResponse=(statusCode:number,message:string,options:HttpResponseOptions=emptyObject)=>createHttpResponse({
    ...options,
    statusCode,
    body:JSON.stringify(message)
})

export const httpEventRouter=async (
    evt:HttpRequestEventVariations,
    routes:RouteMap,
    {
        basePath,
        pathCapture,
        pathCaptureIndex=1,
        requirePathCapture,
        logRequest,
        cors,
        returnsHttpResponse,
        responseDefaults={},
    }:RouteConfig=_defaultRouteConfig
)=>{
    if(logRequest){
        console.info('lambdaUrlRouter',evt);
    }
    if(responseDefaults.cors===undefined){
        responseDefaults.cors=cors;
    }
    let path=(
        (evt?.requestContext?.http?.path)??
        (evt?.requestContext?.path)
    )
    const method=(
        (evt?.requestContext?.http?.method)??
        (evt.requestContext?.httpMethod)
    )?.toUpperCase() as HttpMethod|undefined;

    if(!path){
        return createHttpErrorResponse('event did not define a request path',responseDefaults);
    }

    if(!method){
        return createHttpErrorResponse('event did not define a request method',responseDefaults);
    }

    if(!path.startsWith('/')){
        path='/'+path;
    }

    const uri=path;

    if(pathCapture){
        const match=pathCapture.exec(path);
        if(match){

            path=match[pathCaptureIndex]??'';
            if(!path.startsWith('/')){
                path='/'+path;
            }
        }else if(requirePathCapture){
            return createHttpNotFoundResponse('No capture match',responseDefaults);
        }
    }

    if(basePath){
        if(!path.toLowerCase().startsWith(basePath.toLowerCase())){
            return createHttpNotFoundResponse('No base path match',responseDefaults);
        }
        path=path.substring(basePath.length);
        if(!path.startsWith('/')){
            path='/'+path;
        }
    }

    const body=evt.body?(typeof evt.body === 'string')?JSON.parse(evt.body):evt.body:undefined;
    const routePath=`${method}:${path}`;

    const handler=routes[routePath]??routes[method]??routes['*'];
    if(!handler){
        return createHttpNotFoundResponse('No matching round found',responseDefaults);
    }

    try{
        if(method==='OPTIONS'){
            return createHttpNoContentResponse(responseDefaults);
        }
        const result=await handler({
            uri,
            path,
            method,
            body,
        },body,evt);
        if(result===null){
            return createHttpNotFoundResponse('Resource not found',responseDefaults);
        }else if(result===undefined){
            return createHttpNoContentResponse(responseDefaults);
        }else if(returnsHttpResponse){
            return result;
        }else{
            return createHttpJsonResponse(result,responseDefaults);
        }
    }catch(ex){
        console.error(`RouteHandler failed. path=${routePath}`,ex);
        return createHttpErrorResponse('Internal server error',responseDefaults);
    }
}


interface createHttpEventRouterOverloads
{
    (routes:RouteMap):((evt:HttpRequestEventVariations)=>Promise<any>);
    (config:RouteConfig,routes:RouteMap):((evt:HttpRequestEventVariations)=>Promise<any>);
}

export const createHttpEventRouter:createHttpEventRouterOverloads=(configOrRoutes:RouteConfig|RouteMap,routes?:RouteMap):((evt:HttpRequestEventVariations)=>Promise<any>)=>{
    let config:RouteConfig|undefined;
    if(routes){
        config=configOrRoutes;
    }else{
        config=undefined;
        routes=configOrRoutes as any;
    }
    return (evt:HttpRequestEventVariations)=>httpEventRouter(evt,routes as any,config);
}
