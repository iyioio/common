import { ZodSchema } from "zod";
import { CancelToken } from "./CancelToken";
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

    /**
     * Id of the current transaction
     */
    transactionId?:string;
}

export interface ISqlMethods
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
    updateAsync<T>(table:string|DataTableDescription<T>,item:Partial<T>,primaryKey:keyof T,onlyChanged?:Partial<T>):Promise<boolean|null>;
}

export type SqlTransactionStatus='waiting'|'committing'|'committed'|'rollingBack'|'rolledBack';

export interface ISqlTransaction extends ISqlMethods
{

    get transactionStatus():SqlTransactionStatus;

    get transactionId():string;

    commitAsync(cancel?:CancelToken):Promise<void>;
    /**
     * Called automatically when when the transaction is disposed if not committed.
     */
    rollbackAsync(cancel?:CancelToken):Promise<void>;
}

export interface RunSqlTransactionOptions
{
    disableAutoCommit?:boolean;
}

export interface ISqlClient extends ISqlMethods
{
    beginTransactionAsync(cancel?:CancelToken):Promise<ISqlTransaction>;

    /**
     * Begins a new transaction and passes the transaction to the runAsync callback. If no
     * exceptions are thrown and the transaction is not rolled back then the transaction is
     * committed after runAsync returns.
     */
    runTransactionAsync<T>(
        runAsync:(trans:ISqlTransaction,cancel?:CancelToken)=>Promise<T>,
        options?:RunSqlTransactionOptions,
        cancel?:CancelToken
    ):Promise<T>;
}

export interface SqlExecCommand
{
    sql:string;
    includeResultMetadata?:boolean;
    noLogResult?:boolean;
    transactionId?:string;
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


