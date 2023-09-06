export interface AiCompletionProvider
{
    completeAsync(request:AiCompletionRequest):Promise<AiCompletionResult>;

    canComplete?(request:AiCompletionRequest):boolean;
}

export interface AiCompletionRequest
{
    // todo - add properties that a provider can use to determine if it can handle a prompt
    prompt:AiCompletionMessage[];
    providerData?:any;
}

export interface AiCompletionMessage
{
    role?:'system'|'user'|'assistant'|'function';
    content:string;
    name?:string;
}

export interface AiCompletionResult
{
    options:AiCompletionOption[];
    providerData?:any;
}

export interface AiCompletionOption
{
    message:AiCompletionMessage;
    contentType:string;
    confidence:number;
}
