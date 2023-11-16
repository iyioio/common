import { ZodObject, ZodRawShape, ZodSchema, ZodType } from "zod";
import { DataTableDescription } from "./data-table";

export const getDataTableShape=(table:DataTableDescription):ZodRawShape|undefined=>{

    if(!(table.scheme instanceof ZodObject)){
        return undefined;
    }

    return table.scheme.shape;

}

export const getDataTableId=(table:DataTableDescription|string):string=>{
    if(typeof table === 'string'){
        return table;
    }
    return table.tableId??table.getTableId?.()??table.tableIdParam?.()??table.name;
}

export const getDataTableScheme=<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>):ZodSchema<T>|undefined=>{
    if(tableOrScheme instanceof ZodType){
        return tableOrScheme;
    }else{
        return tableOrScheme.scheme;
    }
}
