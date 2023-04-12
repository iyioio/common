import { ZodSchema } from "zod";
import { ParamTypeDef } from "./scope-types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DataTableDescription<T=any>
{
    name:string;
    primaryKey:string;
    secondaryKey?:string;
    tableId?:string;
    tableIdParam?:ParamTypeDef<string>;
    getTableId?:()=>string;
    mountPath?:string;
    isReadonly?:boolean;
    watchable?:boolean;
    defaultOrderProp?:string;
    defaultOrderDesc?:boolean;
    indexes?:DataTableIndex[];
    ttlProp?:string;
    updateVersionProp?:string;
    scheme?:ZodSchema;
}

export interface DataTableIndex
{
    name:string;

    /**
     * The properties that are included in the index
     */
    props:string[];

    /**
     * Properties to copy data into the index for. This is primarily used with
     * no-sql databases that replicate data when building indexes.
     */
    include?:string[];

    /**
     * Indicates that all properties should copy data into the index. This is primarily
     * used with no-sql databases that replicate data when building indexes.
     */
    includeAll?:boolean;
}