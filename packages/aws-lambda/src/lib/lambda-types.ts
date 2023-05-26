import { Scope } from "@iyio/common";
import type { ZodSchema } from "zod";

export interface LambdaInvokeOptions<TInput=any>
{
    /**
     * Lambda function name or arn
     */
    fn:string;

    /**
     * A friendly name for the function
     */
    label?:string;

    /**
     * Input / payload
     */
    input?:TInput;

    inputScheme?:ZodSchema;

    outputScheme?:ZodSchema;

    /**
     * By default input passed into a FnInvokeEvent to allow metadata to be passed to the
     * target function. If passRawInput is true then the input is passed directly to the
     * target function.
     */
    passRawInput?:boolean;

    /**
     * A scope to invoke the lambda in. Can be used to support multiple user identities.
     */
    scope?:Scope;

}

