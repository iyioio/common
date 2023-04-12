import type { ZodSchema } from "zod";

export interface LambdaInvokeOptions<TInput=any>
{
    /**
     * Lambda function name or arn
     */
    fn:string;

    /**
     * Input / payload
     */
    input?:TInput;

    inputScheme?:ZodSchema;

    outputScheme?:ZodSchema;

}
