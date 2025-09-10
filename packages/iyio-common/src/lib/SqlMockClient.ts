import { ZodSchema } from "zod";
import { CancelToken } from "./CancelToken.js";
import { delayAsync, unused } from "./common-lib.js";
import { NoId, ValueRef } from "./common-types.js";
import { DataTableDescription } from "./data-table.js";
import { getDataTableId } from "./data-table-lib.js";
import { NotImplementedError } from "./errors.js";
import { deepCompare } from "./object.js";
import { ISqlClient, ISqlTransaction, RunSqlTransactionOptions, SqlResult } from "./sql-types.js";
import { uuid } from "./uuid.js";

export const getDefaultTable=():MockTable=>({
    key:'id',
    idGen:'guid',
    items:[]
})

export type MockSqlIdGenerator='guid'|'int'|((item:any)=>any);

export interface MockTable
{
    key:string;
    idGen:MockSqlIdGenerator;
    items:any[];
}

export class SqlMockClient implements ISqlClient
{

    public delay:number=200;

    public log:boolean=false;

    public readonly mockTables:{[tableName:string]:MockTable}={
        _default:getDefaultTable()
    }

    public constructor(mockTableData?:{[tableName:string]:MockTable})
    {
        if(mockTableData){
            for(const e in mockTableData){
                this.mockTables[e]=mockTableData[e] as MockTable;
            }
        }
    }

    dispose(): void {
        // do nothing
    }

    private async delayAsync()
    {
        if(this.delay>0){
            await delayAsync(this.delay);
        }
    }

    public getNextTableMockIntId(table:string):number
    {

        const tbl=this.mockTables[table]??this.mockTables['_default'];
        if(!tbl){
            return 1;
        }

        let id=1;
        for(const item of tbl.items){
            let itemId=Number(item[tbl.key]);
            if(!isFinite(itemId)){
                itemId=0;
            }

            if(itemId>=id){
                id=itemId+1;
            }
        }

        return id;
    }

    public generateMockId(table:string, item:any)
    {
        const tbl=this.mockTables[table]??this.mockTables['_default'];
        if(!item || !tbl || item[tbl.key]!==undefined){
            return;
        }

        switch(tbl.idGen){

            case 'guid':
                item[tbl.key]=uuid();
                break;

            case 'int':
                item[tbl.key]=this.getNextTableMockIntId(table);
                break;

            default:
                item[tbl.key]=tbl.idGen(item);
                break;
        }
    }

    public getMockTable(table:string):MockTable
    {
        let tbl=this.mockTables[table];
        if(!tbl){
            const d=this.mockTables['_default'] as MockTable;
            tbl={
                ...d,
                items:[]
            }
            this.mockTables[table]=tbl;
        }
        return tbl;
    }

    public insertMockItem(table:string,item:any)
    {
        const tbl=this.getMockTable(table);
        this.generateMockId(table,item);
        tbl.items.push(item);

    }

    public async insertAsync<T>(table: string|DataTableDescription<T>, values: NoId<T> | NoId<T>[]): Promise<void> {
        await this.insertReturnAsync(table,values);
    }
    insertReturnAsync<T>(table: string|DataTableDescription<T>, value: NoId<T>): Promise<T>;
    insertReturnAsync<T>(table: string|DataTableDescription<T>, values: NoId<T>[]): Promise<T[]>;
    insertReturnAsync<T>(table: string|DataTableDescription<T>, values: NoId<T> | NoId<T>[]): Promise<T | T[]>;
    public async insertReturnAsync<T>(table: string|DataTableDescription<T>, values: NoId<T> | NoId<T>[]): Promise<T | T[]>{
        table=getDataTableId(table);
        await this.delayAsync();
        if(Array.isArray(values)){
            return values.map(v=>{
                v={...v};
                this.insertMockItem(getDataTableId(table),v);
                return v as any;
            })
        }else{
            values={...values};
            this.insertMockItem(table,values);
            return values as any;
        }

    }
    public async selectAsync<T>(query: string): Promise<T[]> {

        await this.delayAsync();

        let match=
            /.*select\s+(.*)from\s+(\S+)\s*(.*)/i
            .exec(query);

        if(!match){
            return [];
        }

        const table=trimValue(match[2] as string);

        if(!table){
            return [];
        }
        const tbl=this.mockTables[table];
        if(!tbl){
            return [];
        }

        let items=tbl.items;

        query=match[3] as string;

        while(true){

            query=query.trim();

            match=/^where\s+(.*?)\s*(!=|<=|>=|=|<|>)\s*(.*)(limit|where)(.*)/i.exec(query);
            if(match){
                const whereLeft=match[1] as string;
                const whereOp=match[2] as string;
                const whereRight=match[3] as string;
                query=(match[4] as string)+(match[5] as string);
                const newItems=[];
                for(let i=0;i<items.length;i++){
                    const item=items[i];
                    if(comp(whereLeft,whereOp,whereRight,item)){
                        newItems.push(item);
                    }
                }
                items=newItems;
                continue;
            }

            match=/^limit\s+(\d+)(.*)/i.exec(query);
            if(match){
                const limit=match[1];
                query=match[2] as string;
                const l=Number(limit);
                const newItems=[];
                for(let i=0;i<l && i<items.length;i++){
                    newItems.push(items[i]);
                }
                items=newItems;
                continue;
            }


            break;

        }

        return items;
    }
    public async selectFirstOrDefaultAsync<T>(query: string): Promise<T | undefined> {
        const items=await this.selectAsync<T>(query);
        return items[0];
    }
    public async selectColAsync<T>(query: string): Promise<T[]> {
        const items=await this.selectAsync<any>(query);
        const col=/select\s+(\S+)/i.exec(query);
        if(!col){
            return [];
        }

        const prop=trimValue(col[1] as string);

        return items.map(i=>i[prop]);

    }

    public selectFromAsync<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>,query:string):Promise<T[]>{
        return this.selectAsync(query);
    }
    public selectFromFirstOrDefaultAsync<T>(tableOrScheme:DataTableDescription<T>|ZodSchema<T>,query:string):Promise<T|undefined>{
        return this.selectFirstOrDefaultAsync(query);
    }
    public async execAsync(sql: string): Promise<SqlResult> {
        await this.delayAsync();
        unused(sql);
        return {
            updates:0,
        }
    }
    public async updateAsync<T>(table: string|DataTableDescription<T>, item: T, primaryKey: keyof T, onlyChanged?: T | undefined): Promise<boolean | null> {

        table=getDataTableId(table);

        if(onlyChanged && deepCompare(item,onlyChanged)){
            return null;
        }

        await this.delayAsync();

        const tbl=this.mockTables[table];
        if(!tbl){
            return null;
        }

        const index=tbl.items.findIndex(i=>i[primaryKey]===item[primaryKey]);
        if(index===-1){
            return false;
        }
        tbl.items[index]={...item};

        return true;
    }

    async deleteAsync<T>(table: string|DataTableDescription<T>, colName: keyof T, colValue: T[keyof T]): Promise<boolean | undefined> {

        table=getDataTableId(table);

        await this.delayAsync();

        const tbl=this.mockTables[table];
        if(!tbl || colValue===undefined){
            return false;
        }

        let deleted=false;

        for(let i=0;i<tbl.items.length;i++){
            const item=tbl.items[i];

            if(item[colName]===colValue){
                tbl.items.splice(i,1);
                i--;
                deleted=true;
            }
        }

        return deleted;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    beginTransactionAsync(cancel?: CancelToken | undefined): Promise<ISqlTransaction> {
        throw new NotImplementedError();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runTransactionAsync<T>(runAsync: (trans: ISqlTransaction, cancel?: CancelToken | undefined) => Promise<T>, options?: RunSqlTransactionOptions | undefined, cancel?: CancelToken | undefined): Promise<T> {
        throw new NotImplementedError();
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


}


const trimValue=(value:string):string=>{
    value=value.trim();
    if( (value.startsWith('\'') && value.endsWith('\'')) ||
        (value.startsWith('"') && value.endsWith('"')))
    {
        value=value.substring(1,value.length-1).trim();
    }

    return value;
}

const comp=(left:string,op:string,right:string,item:any):boolean=>{

    const itemLeft=left.startsWith('"') || (!left.startsWith('\'') && !isFinite(Number(left)));
    if(itemLeft){
        left=item[trimValue(left)]?.toString()??'';
        right=trimValue(right);
    }else{
        left=trimValue(left);
        right=item[trimValue(right)]?.toString()??'';
    }

    switch(op.trim()){

        case '=':
            return left===right;

        case '!=':
            return left!==right;

        case '>':
            return Number(left)>Number(right);

        case '<':
            return Number(left)>Number(right);

        case '>=':
            return Number(left)>=Number(right);

        case '<=':
            return Number(left)>=Number(right);

        default:
            throw new Error('Mock sql select where queries only support the =,!=,<,>,>=,<= operators')
    }
}
