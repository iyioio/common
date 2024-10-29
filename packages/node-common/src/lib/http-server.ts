import { createHttpRouter } from "@iyio/node-common";
import { Server, createServer } from "http";
import { HttpRoute, defaultHttpServerPort } from "./http-server-lib";

const defaultCorsHeaders:Record<string,string>={
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"*",
    "Access-Control-Allow-Methods":"OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD",
    "Access-Control-Max-Age":"86400",
    "Access-Control-Allow-Credentials":"true",
}


export interface HttpServerOptions
{
    port?:number;
    baseDir?:string;
    displayUrl?:string;
    routes:HttpRoute[];
    removeApiFromPathStart?:boolean;
    serverName?:string;
    hostname?:string;
    addHostToRedirects?:boolean;
    https?:boolean;
}
export const createHttpServer=(options:HttpServerOptions):Server=>{

    const {
        port=defaultHttpServerPort,
        displayUrl,
        serverName='api server',
    }=options;

    const server=createServer(createHttpRouter(options));

    server.listen({
        port,
        exclusive:false,
    });

    console.info(`${serverName} listening on port ${port} - ${displayUrl||`http://localhost:${port}`}`);
    return server;
}
