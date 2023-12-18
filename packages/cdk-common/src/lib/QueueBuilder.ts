import { ParamTypeDef, asArray } from "@iyio/common";
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { AccessGranter, IAccessGrantGroup } from "./cdk-types";

export interface QueueBuilderProps
{
    queues:QueueInfo[];
    managed?:ManagedProps;
}

export interface QueueInfo extends sqs.QueueProps
{
    name:string;
    arnParam?:ParamTypeDef<string>;
    grantAccess?:boolean;
    modify?:(bucket:sqs.Queue)=>void;
    /**
     * If true a dead letter queue will be created and used as the queue's dlq
     */
    dlq?:boolean;
    /**
     * Used together with enableDql and sets the maxReceiveCount of the auto created dlq
     * @default 5
     */
    dlqMaxReceiveCount?:number;

    /**
     * Name of a target or targets of the queue
     */
    target?:string|string[];

    batchSize?:number;

}

export interface QueueResult
{
    info:QueueInfo;
    queue:sqs.Queue;
}

export class QueueBuilder extends Construct implements IAccessGrantGroup
{
    public readonly queues:QueueResult[];

    public readonly accessGrants:AccessGranter[]=[];

    public constructor(scope:Construct, name:string, {
        queues,
        managed:{
            params,
            accessManager,
            queues:namedBuckets,
            beforeOutputs,
        }=getDefaultManagedProps(),
    }:QueueBuilderProps)
    {

        super(scope,name);

        const queueInfos:QueueResult[]=[];


        for(const info of queues){

            const {
                name,
                arnParam,
                grantAccess,
                modify,
                dlq,
                dlqMaxReceiveCount=5,
                target,
                batchSize,
                ...props
            }=info;

            let deadLetterQueue:sqs.Queue|null=null;

            if(dlq && !props.deadLetterQueue){
                deadLetterQueue=new sqs.Queue(this,name+'DLQueue');
                props.deadLetterQueue={
                    maxReceiveCount:dlqMaxReceiveCount,
                    queue:deadLetterQueue,
                }
            }

            const queue=new sqs.Queue(this,name,props);

            namedBuckets?.push({
                name:info.name,
                queue,
            });

            if(arnParam){
                params?.setParam(arnParam,queue.queueArn);
            }

            if(grantAccess){
                this.accessGrants.push({
                    grantName:info.name,
                    grant:request=>{
                        if(request.types?.includes('read')){
                            queue.grantConsumeMessages(request.grantee);
                            deadLetterQueue?.grantConsumeMessages(request.grantee);
                        }
                        if(request.types?.includes('write')){
                            queue.grantSendMessages(request.grantee);
                            deadLetterQueue?.grantSendMessages(request.grantee);
                        }
                        if(request.types?.includes('delete')){
                            queue.grantPurge(request.grantee);
                            deadLetterQueue?.grantPurge(request.grantee);
                        }
                    }
                })
            }

            modify?.(queue);

            const targets=asArray(target);
            if(targets?.length){
                beforeOutputs.push(({fns})=>{
                    for(const target of targets){
                        const t=fns.find(f=>f.name===target);
                        if(t){
                            queue.grantConsumeMessages(t.fn);
                            deadLetterQueue?.grantConsumeMessages(t.fn);

                            const es=new lambdaEventSources.SqsEventSource(queue,{batchSize});
                            t.fn.addEventSource(es);
                        }else{
                            throw new Error(`Queue target (${target}) not found`);
                        }
                    }
                })
            }


            queueInfos.push({
                info,
                queue,
            })

        }

        this.queues=queueInfos;

        accessManager?.addGroup(this);
    }
}
