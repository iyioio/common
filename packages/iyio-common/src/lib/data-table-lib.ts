import { ZodRawShape, ZodSchema } from "zod";
import { DataTableColInfo, DataTableDescription } from "./data-table";
import { valueIsZodObject, valueIsZodType } from "./zod-helpers";

export const getDataTableShape=(table:DataTableDescription):ZodRawShape|undefined=>{

    if(!(valueIsZodObject(table.scheme))){
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

export const getDataTableColInfo=(table:DataTableDescription|string|null|undefined,colName:string):DataTableColInfo|undefined=>{
    if(!table || (typeof table === 'string')){
        return undefined;
    }
    return table.colInfos?.[colName];
}

export const getDataTableScheme=<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>):ZodSchema<T>|undefined=>{
    if(valueIsZodType(tableOrScheme)){
        return tableOrScheme;
    }else{
        return tableOrScheme.scheme;
    }
}
