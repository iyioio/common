import { HttpClient } from "./HttpClient";
import { defineStringParam } from "./scope-lib";
import { Scope } from "./scope-types";
import { SqlExecCommand, SqlResult } from "./sql-types";
import { SqlBaseClient } from "./SqlBaseClient";
import { httpClient } from "./_types.common";

export const sqlHttpClientUrlParam=defineStringParam('sqlHttpClientUrl');

export interface SqlHttpClientOptions
{
    url:string;
}

export class SqlHttpClient extends SqlBaseClient
{

    public static fromScope(scope:Scope,options?:SqlHttpClientOptions)
    {
        return new SqlHttpClient(
            httpClient(scope),
            options??{
                url:scope.require(sqlHttpClientUrlParam)
            }
        )
    }

    private readonly client:HttpClient;
    private readonly options:SqlHttpClientOptions;

    public constructor(client:HttpClient,options:SqlHttpClientOptions)
    {
        super();
        this.client=client;
        this.options={...options}
    }

    public async execAsync(sql:string,includeResultMetadata?:boolean,noLogResult?:boolean):Promise<SqlResult>
    {
        const command:SqlExecCommand={
            sql,
            includeResultMetadata,
            noLogResult,
        }

        const result=await this.client.postAsync<SqlResult>(this.options.url,command);
        if(!result){
            throw new Error('No SqlHttpClient http response')
        }

        return result;
    }
}
