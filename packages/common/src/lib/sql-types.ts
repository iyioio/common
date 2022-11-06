import { NoId } from "./common-types";

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
    insertAsync<T>(table:string,values:NoId<T>|NoId<T>[]):Promise<void>;
    insertReturnAsync<T>(table:string,value:NoId<T>):Promise<T>;
    insertReturnAsync<T>(table:string,values:NoId<T>[]):Promise<T[]>;
    insertReturnAsync<T>(table:string,values:NoId<T>|NoId<T>[]):Promise<T[]|T>
    selectAsync<T>(query:string):Promise<T[]>;
    selectFirstOrDefaultAsync<T>(query:string):Promise<T|undefined>;
    selectColAsync<T>(query:string):Promise<T[]>;
    execAsync(sql:string,includeResultMetadata?:boolean,noLogResult?:boolean):Promise<SqlResult>;
    updateAsync<T>(table:string,item:T,primaryKey:keyof T,onlyChanged?:T):Promise<boolean|null>;
}




