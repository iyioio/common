import { BehaviorSubject, Subscription } from "rxjs";
import { downloadObject } from "./client-download";
import { unused } from "./common-lib";
import { joinPaths } from "./fs";
import { deepClone, deepCompare } from "./object";
import { sortStaticQuery } from "./query-static-operators";
import { isBaseQueryRecord, isQuery, isQueryWithData, Query, QueryOptions, QueryOrQueryWithData, StaticQueryOperator } from "./query-types";
import { queryRecordStorePathParam } from "./QueryCtrl.deps";
import { ReadonlySubject } from "./rxjs-types";
import { Scope } from "./scope-types";
import { buildQuery } from "./sql-query-builder";
import { sqlClient } from "./sql.deps";
import { IStore } from "./store-types";
import { storeRoot } from "./store.deps";


export interface QueryCtrlError
{
    message:string;
    error?:any;
}

export interface QueryState<T>
{
    data:T[];
    query:QueryOrQueryWithData<T>;
    total?:number;
    hasMore?:boolean;
    totalQuery?:Query;
}

export interface QueryCtrlState<T>
{
    queryData?:QueryState<T>;
    loading?:boolean;
    error?:QueryCtrlError;
}

export const defaultQueryRecordStorePath='/QueryRecords'

export interface QueryCtrlOptions
{
    store?:IStore;
    queryRecordStorePath?:string;
}


export class QueryCtrl<T=any>
{

    public static optionsFromScope(scope:Scope):QueryCtrlOptions
    {
        return {
            store:storeRoot(scope),
            queryRecordStorePath:queryRecordStorePathParam(scope),

        }
    }

    public static fromScope(scope:Scope):QueryCtrl{
        return new QueryCtrl(QueryCtrl.optionsFromScope(scope));
    }

    private readonly store:IStore;
    private readonly queryRecordStorePath:string;

    private readonly _query=new BehaviorSubject<QueryOptions<T>|null>(null);
    public get query(){return this._query.value}
    public set query(value:QueryOptions<T>|null){
        if(value===this._query.value){
            return;
        }
        this._query.next(value);
    }
    public get querySubject(){return this._query}

    private readonly _state=new BehaviorSubject<QueryCtrlState<T>>({});
    public get state():ReadonlySubject<QueryCtrlState<T>>{return this._state};

    private readonly _data=new BehaviorSubject<T[]|null>(null);
    public get data():ReadonlySubject<T[]|null>{return this._data};

    public readonly getLink=new BehaviorSubject<((item:T)=>string|null)|null>(null);

    public readonly staticOperators:StaticQueryOperator[]=[
        sortStaticQuery
    ];


    public defaultLimit=50;

    private runId=0;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}

    private readonly querySub:Subscription;

    public constructor({
        store=storeRoot(),
        queryRecordStorePath=defaultQueryRecordStorePath
    }:QueryCtrlOptions={})
    {
        this.store=store;
        this.queryRecordStorePath=queryRecordStorePath;
        this.querySub=this._query.subscribe(v=>{
            this.loadAsync(v);
        })
    }

    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.runId++;
        this.querySub.unsubscribe();
    }

    public async loadAsync(queryOptions:QueryOptions|null|undefined){

        if(this._isDisposed){
            return;
        }

        const rId=++this.runId;

        let query:QueryOrQueryWithData<T>|undefined;
        let totalQuery:Query|undefined;
        const prev=this._state.value.queryData;

        try{

            query=await this.getQueryOrQueryWithDataAsync();
            if(rId!==this.runId){return}

            if(!query){
                this._state.next({});
                return;
            }

            let data:T[];
            let total:number|undefined;

            if(query.limit===undefined){
                query={...query,limit:this.defaultLimit}
            }

            if(isQuery(query)){
                if(!this._state.value.loading){
                    this._state.next({loading:true});
                }
                data=await sqlClient().selectAsync<T>(buildQuery(query));
                if(rId!==this.runId){return}

                const ts=await this.getTotalStateAsync(query,prev);
                if(rId!==this.runId){return}

                total=ts.total;
                totalQuery=ts.totalQuery;

            }else{
                data=query.table;
                total=data.length;

                if(this.staticOperators?.length){
                    data=[...data];
                    for(const op of this.staticOperators){
                        op.op(data,query);
                    }
                }
            }

            this._state.next({
                queryData:{
                    query,
                    data,
                    total,
                    totalQuery
                }
            });
            this._data.next(data);

        }catch(ex){
            console.error('query failed',{query,queryOptions},ex);
            if(rId===this.runId){
                this._state.next({
                    error:{
                        message:(ex as any)?.message??'query failed',
                        error:ex
                    }
                })
            }
        }
    }

    public updateQuery(update:(query:QueryOrQueryWithData<T>,state:QueryState<T>)=>void|boolean){
        const state=this._state.value.queryData;
        if(!state){
            return;
        }
        const q=deepClone(state.query);
        if(update(q,state)===false){
            return;
        }
        this.querySubject.next(q);
    }

    private async getTotalStateAsync(query:Query,prev:QueryState<T>|undefined)
    {
        const totalQuery:Query={
            table:query.table,
            tableAs:query.tableAs,
            condition:deepClone(query.condition),
            columns:[{func:'count',name:'count'}]
        }
        if(prev?.query && prev?.total!==undefined && deepCompare(totalQuery,prev?.totalQuery)){
            return {
                total:prev.total,
                totalQuery:prev.totalQuery
            }
        }
        const total=(await sqlClient().selectColAsync<number>(buildQuery(totalQuery)))[0]??undefined;
        return {
            total,
            totalQuery
        }
    }

    public setPage(page:number)
    {
        this.updateQuery((q,state)=>{
            page=Math.round(page);
            const offset=page*(q.limit??this.defaultLimit);
            if(offset<0 || (state.total && offset>=state.total)){
                return false;
            }
            q.offset=offset;
            return true;
        })
    }

    public setLimit(limit:number)
    {
        this.updateQuery((q)=>{
            limit=Math.round(limit);
            if(q.limit===limit || limit<1){
                return false;
            }
            q.limit=limit;
            return true;
        })
    }

    private async getQueryOrQueryWithDataAsync():Promise<QueryOrQueryWithData<T>|undefined>
    {
        const queryOptions=this.querySubject.value;
        try{
            if(!queryOptions){
                return undefined;
            }

            if(typeof queryOptions === 'string'){// is QueryRecord id
                this._state.next({loading:true})
                const path=joinPaths(this.queryRecordStorePath,queryOptions);
                const record=await this.store.getAsync?.(path);
                if(!record?.query){
                    throw new Error(`Unable to find query record in store at path ${path}`)
                }
                return record.query;
            }else if(isBaseQueryRecord(queryOptions)){
                return queryOptions.query
            }else if(isQuery(queryOptions) || isQueryWithData(queryOptions)){
                return queryOptions;
            }else{
                throw new Error('Invalid query option. String, QueryRecord or Query expected');
            }
        }catch(ex){
            console.error('query failed',{queryOptions},ex);
        }
        return undefined;
    }

    public async downloadAsync(format:'json')
    {
        unused(format);

        let data:T[];

        let query=await this.getQueryOrQueryWithDataAsync();
        if(isQuery(query)){
            query={...query};
            delete query.offset;
            delete query.limit;
            data=await sqlClient().selectAsync(buildQuery(query));
        }else if(isQueryWithData(query)){
            data=query.table;
        }else{
            data=[];
        }

        downloadObject((query?.tableAs??(typeof query?.table === 'string'?query.table:'data'))+'.json',data);

    }

}
