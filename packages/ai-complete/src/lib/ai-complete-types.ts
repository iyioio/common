import { JsonScheme } from "@iyio/common";
import { z } from "zod";

export interface AiCompletionProvider
{
    completeAsync(request:AiCompletionRequest):Promise<AiCompletionResult>;

    canComplete?(request:AiCompletionRequest):boolean;
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

export const AiCompletionMessageScheme=z.object({
    role:AiCompletionRoleScheme.optional(),
    content:z.string(),
    name:z.string().optional(),
    call:AiCompletionFunctionCallScheme.optional(),
})
export type AiCompletionMessage=z.infer<typeof AiCompletionMessageScheme>;


export const AiCompletionOptionScheme=z.object({
    message:AiCompletionMessageScheme,
    contentType:z.string(),
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
