import { ZodSchema } from "zod";
import { CancelToken } from "./CancelToken";
import { DisposeContainer } from "./DisposeContainer";
import { aryRemoveItem } from "./array";
import { NoId, ValueRef } from "./common-types";
import { DataTableDescription } from "./data-table";
import { getDataTableColInfo, getDataTableId, getDataTableScheme } from "./data-table-lib";
import { DisposedError } from "./errors";
import { deepCompare, objGetFirstValue } from "./object";
import { escapeSqlName, escapeSqlValue, sql, sqlName } from "./sql-lib";
import { ISqlClient, ISqlMethods, ISqlTransaction, RunSqlTransactionOptions, SqlResult } from "./sql-types";
import { zodCoerceNullDbValuesInObject } from "./zod-helpers";

export abstract class SqlBaseMethods implements ISqlMethods
{
    public log:boolean=false;

    protected readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
    }



    /**
     * Updates an item in a table by coping the srcItem then calling the mutate callback using the
     * copy of the srcItem. Only changes made to the mutation will be saved to the database.
     * @param table The table in which the item exists
     * @param srcItem The source item that will be copied
     * @param mutate A callback function that will mutate a copy of the srcItem
     */
    public mutateAsync<T,P extends Partial<T>,I=T extends P?T:P>(
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
     */
    public mutateAsync<T,P extends Partial<T>,I=T extends P?T:P>(
        table:string,
        srcItem:Readonly<I>,
        primaryKey:keyof T,
        mutate:(copy:I)=>void|I|Promise<I|void>,
        updateResultRef?:ValueRef<boolean|null>
    ):Promise<I>;

    async mutateAsync<T,P extends Partial<T>,I=T extends P?T:P>(
        table:string|DataTableDescription<T>,
        srcItem:Readonly<I>,
        primaryKeyOrMutate:(keyof T)|((copy:I)=>void|I|Promise<void|I>),
        mutateOrUpdateRef?:((copy:I)=>void|I|Promise<void|I>)|ValueRef<boolean|null>,
        updateResultRef?:ValueRef<boolean|null>
    ):Promise<I>{

        const key=(typeof primaryKeyOrMutate === 'string')?primaryKeyOrMutate:(typeof table === 'object')?table.primaryKey:null;
        if(!key){
            throw new Error('table must be a DataTableDescription or primaryKeyOrMutate must be a string')
        }

        const copy={...srcItem};

        const mutate=(typeof mutateOrUpdateRef === 'function')?mutateOrUpdateRef:(typeof primaryKeyOrMutate === 'function')?primaryKeyOrMutate:undefined;

        if(!mutate){
            if(updateResultRef){
                updateResultRef.value=null;
            }
            return copy;
        }

        const mutation=(await mutate(copy))??copy;

        const updateResult=await this.updateAsync<T>(table,copy as any,key as (keyof T),srcItem as any);
        if(updateResultRef){
            updateResultRef.value=updateResult;
        }

        return mutation;
    }

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
    public async updateAsync<T>(
        table:string|DataTableDescription<T>,
        item:Partial<T>,
        primaryKey:keyof T,
        onlyChanged?:Partial<T>,
        nullOptionals?:boolean
    ):Promise<boolean|null>{

        const ot=table;
        table=getDataTableId(table);

        const changes:string[]=[];

        const primaryKeyValue=item[primaryKey];
        if(primaryKeyValue===undefined){
            throw new Error(`updateAsync item primary key (${String(primaryKey)}) required`);
        }

        for(const e in item){
            if( e===primaryKey ||
                (onlyChanged && deepCompare(item[e],onlyChanged[e]))
            ){
                continue;
            }

            changes.push(`${escapeSqlName(e)}=${escapeSqlValue(item[e],getDataTableColInfo(ot,e))}`);
        }

        if(nullOptionals && (typeof ot ==='object') && ot.colInfos){
            for(const e in ot.colInfos){
                const name=ot.colInfos[e]?.name;
                if(!name || (name in item) || name===primaryKey){
                    continue;
                }

                changes.push(`${escapeSqlName(name)}=NULL`);
            }
        }

        if(!changes.length){
            return null;
        }

        const sql=`UPDATE ${escapeSqlName(table)} SET ${changes.join(',')} WHERE ${escapeSqlName(primaryKey as string)}=${escapeSqlValue(primaryKeyValue)}`;

        const r=await this.execAsync(sql);

        return r.updates>0;
    }

    /**
     * Inserts a new items into a table. If you need reference to the newly created items with their
     * generated ids use the insertReturn function.
     * @param table The table to insert the item into.
     * @param values The items to insert into the table
     */
    public async insertAsync<T>(table:string|DataTableDescription<T>,values:NoId<T>|NoId<T>[]):Promise<void>
    {

        table=getDataTableId(table);
        await this._insertAsync(table,values,false,(typeof table !== 'string'?table:undefined));
    }


    /**
     * Inserts a new item into a table and returns the newly created item with its generated id.
     * If you do not need a reference to the newly created item use the insertAsync function.
     * @param table The table to insert the item into.
     * @param value The item to insert into the table
     */
    public insertReturnAsync<T>(table:string|DataTableDescription<T>,value:NoId<T>):Promise<T>;

    /**
     * Inserts new items into a table and returns the newly created items with their generated ids.
     * If you do not need a reference to the newly created items use the insertAsync function.
     * @param table The table to insert the item into.
     * @param values The items to insert into the table
     */
    public insertReturnAsync<T>(table:string|DataTableDescription<T>,values:NoId<T>[]):Promise<T[]>;

    /**
     * Inserts new items into a table and returns the newly created items with their generated ids.
     * If you do not need a reference to the newly created items use the insertAsync function.
     * @param table The table to insert the item into.
     * @param values The items to insert into the table
     */
    public async insertReturnAsync<T>(table:string|DataTableDescription<T>,values:NoId<T>|NoId<T>[]):Promise<T[]|T>
    {

        const tableName=getDataTableId(table);

        const r=await this._insertAsync(tableName,values,true,(typeof table !== 'string'?table:undefined));



        if(Array.isArray(values)){
            const rows=(r.rows as any)??[];

            if((typeof table === 'object') && table.scheme){
                for(const item of rows){
                    zodCoerceNullDbValuesInObject(table.scheme,item);
                }
            }

            return rows;
        }else{
            const item=r.rows?.[0];
            if(!item){
                throw new Error('No SQL Row Inserted');
            }

            if((typeof table === 'object') && table.scheme){
                zodCoerceNullDbValuesInObject(table.scheme,item);
            }
            return item as any;
        }
    }

    /**
     * Used by the insertAsync and insertReturnAsync functions.
     * @param returnInserted If true the query will be executed with "RETURNING *"
     */
    private async _insertAsync<T>(table:string,values:NoId<T>|NoId<T>[],returnInserted:boolean,dataTable?:DataTableDescription):Promise<SqlResult>
    {
        if(!Array.isArray(values)){
            values=[values];
        }

        if(values.length===0){
            return {updates:0};
        }

        const keys:string[]=[];
        for(const v of values){
            for(const e in v){
                if(!keys.includes(e)){
                    keys.push(e);
                }
            }
        }

        if(!keys.length){
            return {updates:0};
        }


        const rows:string[]=[];
        for(const v of values){
            let row='(';
            for(const k of keys){
                row+=(row==='('?'':',')+escapeSqlValue((v as any)[k],getDataTableColInfo(dataTable,k))
            }
            rows.push(row+')');
        }

        const sql=`INSERT INTO ${escapeSqlName(table)} (${keys.map(k=>escapeSqlName(k)).join(',')}) VALUES ${rows.join(',')} ${returnInserted?'RETURNING *':''}`;

        return await this.execAsync(sql,true);

    }

    /**
     * Returns an array of items selected by the query.
     * @param query A SQL query to select items with
     */
    public async selectAsync<T>(query:string):Promise<T[]>
    {
        const r=await this.execAsync(query,true,true);

        if(this.log){
            console.info(JSON.stringify(r.rows??[],null,4));
        }

        return (r.rows as any)??[];

    }

    /**
     * Returns an array of items selected by the query.
     * @param query A SQL query to select items with
     */
    public async selectFromAsync<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>,query:string):Promise<T[]>
    {
        const rows=await this.selectAsync<T>(query);

        const scheme=getDataTableScheme(tableOrScheme);
        if(scheme){
            for(let i=0;i<rows.length;i++){
                const item=rows[i];
                if(!item){continue}

                zodCoerceNullDbValuesInObject(scheme,item);
            }
        }

        return rows;

    }

    /**
     * Returns the first item selected by a query. In most cases the query should include a
     * "LIMIT 1" clause.
     * @param query A SQL query to select a single item
     */
    public async selectFirstOrDefaultAsync<T>(query:string):Promise<T|undefined>
    {
        const r=await this.execAsync(query,true,true);

        if(this.log){
            console.info(JSON.stringify(r.rows??[],null,4));
        }

        return r.rows?.[0] as any;

    }

    /**
     * Returns the first item selected by a query. In most cases the query should include a
     * "LIMIT 1" clause.
     * @param query A SQL query to select a single item
     */
    public async selectFromFirstOrDefaultAsync<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>,query:string):Promise<T|undefined>
    {
        const first=await this.selectFirstOrDefaultAsync<T>(query);
        if(!first){
            return first;
        }

        const scheme=getDataTableScheme(tableOrScheme);
        if(scheme){
            zodCoerceNullDbValuesInObject(scheme,first);
        }

        return first;

    }

    /**
     * Returns the first column of a select query. This can be useful when you only need a single
     * property of a collection of items.
     * @param query A SQL query to select a single column of items
     */
    public async selectColAsync<T>(query:string):Promise<T[]>
    {
        const r=await this.execAsync(query,true);

        const ary:T[]=[];

        if(r.rows){
            for(const record of r.rows){
                const value=objGetFirstValue(record);
                if(value!==undefined){
                    ary.push(value);
                }
            }
        }

        if(this.log){
            console.info(JSON.stringify(ary,null,4));
        }

        return ary;
    }

    public async deleteAsync<T>(table:string|DataTableDescription<T>,colName:keyof T,colValue:T[keyof T]):Promise<boolean|undefined>
    {
        table=getDataTableId(table);

        const r=await this.execAsync(sql`
            DELETE FROM ${sqlName(table)} WHERE ${sqlName(colName.toString())} = ${colValue}
        `);

        return r.updates>0;
    }

    /**
     * Executes an sql statement and optionally returns selected items as formatted rows.
     * @param sql The sql to executed
     * @param includeResultMetadata If true and the first statement of the sql selects data
     *                              the selected data will be parsed and stored in the rows
     *                              property of the returned SqlResult
     * @param noLogResult If true logging is disable even if the client is configured to log results
     * @returns an SqlResult object
     */
    public abstract execAsync(sql:string,includeResultMetadata?:boolean,noLogResult?:boolean):Promise<SqlResult>;
}


export abstract class SqlBaseClient extends SqlBaseMethods implements ISqlClient
{


    private readonly openTransactions:ISqlTransaction[]=[];

    public override dispose():void{
        super.dispose();
        for(const t of this.openTransactions){
            t.dispose();
        }
    }

    public async beginTransactionAsync(cancel?:CancelToken):Promise<ISqlTransaction>
    {
        if(this.isDisposed){
            throw new DisposedError();
        }
        const t=await this._beginTransactionAsync(cancel);
        t.log=this.log;
        if(this.isDisposed){
            t.dispose();
            return t;
        }
        this.openTransactions.push(t);
        return t;
    }

    protected abstract _beginTransactionAsync(cancel?:CancelToken):Promise<ISqlTransaction>;

    protected closeTransaction(transaction:ISqlTransaction)
    {
        aryRemoveItem(this.openTransactions,transaction);
    }

    public async runTransactionAsync<T>(
        runAsync:(trans:ISqlTransaction,cancel?:CancelToken)=>Promise<T>,
        options?:RunSqlTransactionOptions,
        cancel?:CancelToken):Promise<T>
    {
        const trans=await this.beginTransactionAsync(cancel);
        try{
            const r=await runAsync(trans,cancel);
            if(trans.transactionStatus==='waiting' && !options?.disableAutoCommit){
                await trans.commitAsync(cancel);
            }
            return r;
        }catch(ex){
            if(trans.transactionStatus==='waiting'){
                await trans.rollbackAsync();
            }
            throw ex;
        }

    }

}
