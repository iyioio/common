import { ZodSchema } from "zod";
import { NoId } from "./common-types";
import { DataTableDescription } from "./data-table";

export interface SqlRequest
{
    sql:string;
    includeResultMetadata?:boolean;
}

export interface SqlRow
{
    [key:string]:any;
}

export interface SqlResult
{
    /**
     * The number of rows updated
     */
    updates:number;

    /**
     * Formatted rows of data selected by a query
     */
    rows?:SqlRow[];
}


export interface ISqlClient
{
    log:boolean;
    dispose():void;
    insertAsync<T>(table:string|DataTableDescription<T>,values:NoId<T>|NoId<T>[]):Promise<void>;
    insertReturnAsync<T>(table:string|DataTableDescription<T>,value:NoId<T>):Promise<T>;
    insertReturnAsync<T>(table:string|DataTableDescription<T>,values:NoId<T>[]):Promise<T[]>;
    insertReturnAsync<T>(table:string|DataTableDescription<T>,values:NoId<T>|NoId<T>[]):Promise<T[]|T>;
    selectAsync<T>(query:string):Promise<T[]>;
    selectFirstOrDefaultAsync<T>(query:string):Promise<T|undefined>;
    selectFromAsync<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>,query:string):Promise<T[]>;
    selectFromFirstOrDefaultAsync<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>,query:string):Promise<T|undefined>;
    selectColAsync<T>(query:string):Promise<T[]>;
    deleteAsync<T>(table:string|DataTableDescription<T>,colName:keyof T,colValue:T[keyof T]):Promise<boolean|undefined>;
    execAsync(sql:string,includeResultMetadata?:boolean,noLogResult?:boolean):Promise<SqlResult>;
    updateAsync<T>(table:string|DataTableDescription<T>,item:T,primaryKey:keyof T,onlyChanged?:T):Promise<boolean|null>;
}

export interface SqlExecCommand
{
    sql:string;
    includeResultMetadata?:boolean;
    noLogResult?:boolean;
}

export interface SqlMigration
{
    name:string;

    /**
     * An SQL script to upgrade to the migration from the previous migration
     */
    up:string;

    /**
     * An SQL script to downgrade to the migration from the next migration
     */
    down:string;
}


