import { NoId } from "./common-types";
import { deepCompare, objGetFirstValue } from "./object";
import { escapeSqlName, escapeSqlValue } from "./sql";
import { ISqlClient, SqlResult } from "./sql-types";




export abstract class SqlBaseClient implements ISqlClient
{
    public log:boolean=false;

    /**
     * Disposes of the client and its underling RDSDataClient
     */
    public dispose()
    {
        // do nothing for now
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
    public async updateAsync<T>(table:string, item:T, primaryKey:keyof T, onlyChanged?:T):Promise<boolean|null>
    {
        const changes:string[]=[];

        for(const e in item){
            if( e===primaryKey ||
                (onlyChanged && deepCompare(item[e],onlyChanged[e]))
            ){
                continue;
            }

            changes.push(`${escapeSqlName(e)}=${escapeSqlValue(item[e])}`);
        }

        if(!changes.length){
            return null;
        }

        const sql=`UPDATE ${escapeSqlName(table)} SET ${changes.join(',')} WHERE ${escapeSqlName(primaryKey as string)}=${escapeSqlValue(item[primaryKey])}`;

        const r=await this.execAsync(sql);

        return r.updates>0;
    }

    /**
     * Inserts a new items into a table. If you need reference to the newly created items with their
     * generated ids use the insertReturn function.
     * @param table The table to insert the item into.
     * @param values The items to insert into the table
     */
    public async insertAsync<T>(table:string,values:NoId<T>|NoId<T>[]):Promise<void>
    {
        await this._insertAsync(table,values,false);
    }


    /**
     * Inserts a new item into a table and returns the newly created item with its generated id.
     * If you do not need a reference to the newly created item use the insertAsync function.
     * @param table The table to insert the item into.
     * @param value The item to insert into the table
     */
    public insertReturnAsync<T>(table:string,value:NoId<T>):Promise<T>;

    /**
     * Inserts new items into a table and returns the newly created items with their generated ids.
     * If you do not need a reference to the newly created items use the insertAsync function.
     * @param table The table to insert the item into.
     * @param values The items to insert into the table
     */
    public insertReturnAsync<T>(table:string,values:NoId<T>[]):Promise<T[]>;

    /**
     * Inserts new items into a table and returns the newly created items with their generated ids.
     * If you do not need a reference to the newly created items use the insertAsync function.
     * @param table The table to insert the item into.
     * @param values The items to insert into the table
     */
    public async insertReturnAsync<T>(table:string,values:NoId<T>|NoId<T>[]):Promise<T[]|T>
    {
        const r=await this._insertAsync(table,values,true);

        if(Array.isArray(values)){
            return (r.rows as any)??[];
        }else{
            const item=r.rows?.[0];
            if(!item){
                throw new Error('No SQL Row Inserted');
            }
            return item as any;
        }
    }

    /**
     * Used by the insertAsync and insertReturnAsync functions.
     * @param returnInserted If true the query will be executed with "RETURNING *"
     */
    private async _insertAsync<T>(table:string,values:NoId<T>|NoId<T>[],returnInserted:boolean):Promise<SqlResult>
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
                row+=(row==='('?'':',')+escapeSqlValue((v as any)[k])
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
