import { delayAsync, unused } from "./common-lib";
import { NoId } from "./common-types";
import { deepCompare } from "./object";
import { ISqlClient, SqlResult } from "./sql-types";
import { uuid } from "./uuid";

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

    public async insertAsync<T>(table: string, values: NoId<T> | NoId<T>[]): Promise<void> {
        await this.insertReturnAsync(table,values);
    }
    insertReturnAsync<T>(table: string, value: NoId<T>): Promise<T>;
    insertReturnAsync<T>(table: string, values: NoId<T>[]): Promise<T[]>;
    insertReturnAsync<T>(table: string, values: NoId<T> | NoId<T>[]): Promise<T | T[]>;
    public async insertReturnAsync<T>(table: string, values: NoId<T> | NoId<T>[]): Promise<T | T[]>{
        await this.delayAsync();
        if(Array.isArray(values)){
            return values.map(v=>{
                v={...v};
                this.insertMockItem(table,v);
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
    public async execAsync(sql: string): Promise<SqlResult> {
        await this.delayAsync();
        unused(sql);
        return {
            updates:0,
        }
    }
    public async updateAsync<T>(table: string, item: T, primaryKey: keyof T, onlyChanged?: T | undefined): Promise<boolean | null> {

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

    async deleteAsync<T>(table: string, colName: keyof T, colValue: T[keyof T]): Promise<boolean | undefined> {

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
