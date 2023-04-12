import { ZodError } from "zod";

export const getZodErrorMessage=(zodError:ZodError):string=>{
    return zodError.message;
}
