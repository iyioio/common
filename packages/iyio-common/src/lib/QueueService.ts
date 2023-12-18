import { continueFunction } from "./common-lib";
import { IQueueClient, QueueMessageCollection, QueuePullRequest, QueuePushRequest, QueuePushResult } from "./queue-types";
import { queueClientProviders } from "./queue.deps";
import { ProviderTypeDef, Scope } from "./scope-types";

export interface QueueServiceOptions
{
    providers:ProviderTypeDef<IQueueClient>;
}

export class QueueService
{
    public static fromScope(scope:Scope):QueueService{
        return new QueueService({
            providers:scope.to(queueClientProviders)
        })
    }

    private readonly providers:ProviderTypeDef<IQueueClient>

    public constructor({
        providers
    }:QueueServiceOptions){
        this.providers=providers;
    }

    public async pushAsync(request:QueuePushRequest):Promise<QueuePushResult>
    {
        const result=await this.providers.getFirstAsync(null,async client=>{
            if(!client.pushAsync){
                return continueFunction;
            }
            return await client.pushAsync(request)??continueFunction
        });

        if(!result){
            throw new Error('push item failed, no supported queue client found');
        }
        return result;
    }

    public async pullAsync(request:QueuePullRequest):Promise<QueueMessageCollection>
    {
        const collection=await this.providers.getFirstAsync(null,async client=>{
            if(!client.pullAsync){
                return continueFunction;
            }
            return await client.pullAsync(request)??continueFunction;
        });

        if(!collection){
            throw new Error('pull items failed, no supported queue client found')
        }
        return collection;
    }
}
