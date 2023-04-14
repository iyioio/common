import { ZodObject, ZodRawShape } from "zod";
import { DataTableDescription } from "./data-table";

export const getDataTableShape=(table:DataTableDescription):ZodRawShape|undefined=>{

    if(!(table.scheme instanceof ZodObject)){
        return undefined;
    }

    return table.scheme.shape;

}
