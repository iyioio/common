export interface HttpRequestContextBase
{
    req:any;
    res:any;
    path:string;
    query:Record<string,string>;
    filePath:string;
    body?:any;
    method:string;
}

export interface HttpRouteBase
{
    path?:string|string[];
    match?:RegExp|RegExp[];
    method?:string|string[];
    handler:(ctx:HttpRequestContextBase)=>any|Promise<any>;
    rawBody?:boolean;
}
