import { JsonScheme } from "@iyio/common";
import { z } from "zod";

export interface CompletionOptions
{
    allowedModels?:string[];
}

export interface AiCompletionProvider
{
    completeAsync(request:AiCompletionRequest,options?:CompletionOptions):Promise<AiCompletionResult>;

    canComplete?(request:AiCompletionRequest,options?:CompletionOptions):boolean;
}

// export const AiCompletionFunctionParamScheme=z.object({
//     name:z.string(),
//     description:z.string(),
//     type:z.string(),
//     required:z.boolean().optional(),
//     jsonScheme:z.record(z.any()).optional(),
// })
// export type AiCompletionFunctionParam=z.infer<typeof AiCompletionFunctionParamScheme>;

export const AiCompletionFunctionScheme=z.object({
    name:z.string(),
    description:z.string(),
    params:z.record(z.any()).optional(),
})
export type AiCompletionFunction=Omit<z.infer<typeof AiCompletionFunctionScheme>,'params'> & {
    params?:JsonScheme;
};

export const AiCompletionFunctionCallScheme=z.object({
    name:z.string(),
    params:z.record(z.any()),
})
export type AiCompletionFunctionCall=z.infer<typeof AiCompletionFunctionCallScheme>;

export const AiCompletionRoleScheme=z.enum(['system','user','assistant','function']);
export type AiCompletionRole=z.infer<typeof AiCompletionRoleScheme>;

export const AiComplationMessageTypeScheme=z.enum(['text','image']);
export type AiComplationMessageType=z.infer<typeof AiComplationMessageTypeScheme>;

export const AiCompletionMessageScheme=z.object({
    role:AiCompletionRoleScheme.optional(),
    content:z.string().optional(),
    url:z.string().optional(),
    /**
     * The type of the message
     */
    type:AiComplationMessageTypeScheme,
    /**
     * The requested message type to response with.
     * @defaul 'text'
     */
    requestedResponseType:AiComplationMessageTypeScheme.optional(),
    name:z.string().optional(),
    call:AiCompletionFunctionCallScheme.optional(),
})
export type AiCompletionMessage=z.infer<typeof AiCompletionMessageScheme>;


export const AiCompletionOptionScheme=z.object({
    message:AiCompletionMessageScheme,
    confidence:z.number(),
})
export type AiCompletionOption=z.infer<typeof AiCompletionOptionScheme>;


export const AiCompletionResultScheme=z.object({
    options:AiCompletionOptionScheme.array(),
    providerData:z.any().optional(),
})
export type AiCompletionResult=z.infer<typeof AiCompletionResultScheme>;


export const AiCompletionRequestScheme=z.object({
    // todo - add properties that a provider can use to determine if it can handle a prompt
    prompt:AiCompletionMessageScheme.array(),
    providerData:z.any().optional(),
    functions:AiCompletionFunctionScheme.array().optional(),
    returnProviderData:z.boolean().optional(),
    model:z.string().optional(),
})
export type AiCompletionRequest=z.infer<typeof AiCompletionRequestScheme>;



export interface _AiCompletionRequest
{
    prompt:AiCompletionMessage[];
    providerData?:any;
}

export interface _AiCompletionResult
{
    options:AiCompletionOption[];
    providerData?:any;
}

export interface _AiCompletionOption
{
    message:AiCompletionMessage;
    contentType:string;
    confidence:number;
}

export interface _AiCompletionMessage
{
    role?:AiCompletionRole;
    content:string;
    name?:string;
}
