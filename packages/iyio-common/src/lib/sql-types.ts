import { ZodSchema } from "zod";
import { CancelToken } from "./CancelToken";
import { NoId, ValueRef } from "./common-types";
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

    /**
     * Updates an item in a specified table.
     * @param table The table in which the item exists
     * @param item The item to be updated
     * @param primaryKey The primary key of the table. In most cases this will be "id"
     * @param onlyChanged If supplied only properties of the item that are not equal to the properties
     *                    of onlyChanged will be updated. This can reduce the size if the SQL query
     *                    and only update properties that need to be updated.
     * @returns True if the item was updated, false if no changes were made to the item and null
     *          if the onlyChange parameter was supplied and their was no difference between it and
     *          the item parameter.
     */
    updateAsync<T>(table:string|DataTableDescription<T>,item:Partial<T>,primaryKey:keyof T,onlyChanged?:Partial<T>):Promise<boolean|null>;

    /**
     * Updates an item in a table by coping the srcItem then calling the mutate callback using the
     * copy of the srcItem. Only changes made to the mutation will be saved to the database.
     * @param table The table in which the item exists
     * @param srcItem The source item that will be copied
     * @param mutate A callback function that will mutate a copy of the srcItem
     * @param updateResultRef If supplied the return value of updateAsync will be placed in the ref
     */
    mutateAsync<T,P extends Partial<T>,I=T extends P?T:P>(
        table:DataTableDescription<T>,
        srcItem:Readonly<I>,
        mutate:(copy:I)=>void|I|Promise<I|void>,
        updateResultRef?:ValueRef<boolean|null>
    ):Promise<I>;

    /**
     * Updates an item in a table by coping the srcItem then calling the mutate callback using the
     * copy of the srcItem. Only changes made to the mutation will be saved to the database.
     * @param table The table in which the item exists
     * @param srcItem The source item that will be copied
     * @param primaryKey The primary key of the table
     * @param mutate A callback function that will mutate a copy of the srcItem
     * @param updateResultRef If supplied the return value of updateAsync will be placed in the ref
     */
    mutateAsync<T,P extends Partial<T>,I=T extends P?T:P>(
        table:string,
        srcItem:Readonly<I>,
        primaryKey:keyof T,
        mutate:(copy:I)=>void|I|Promise<I|void>,
        updateResultRef?:ValueRef<boolean|null>
    ):Promise<I>;
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


