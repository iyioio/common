import { secondsToCdkDuration } from "@iyio/cdk-common";
import { safeParseNumberOrUndefined } from "@iyio/common";
import { protoAddContextParam, protoGetChildrenByName, protoGetParamName, ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { RemovalPolicy } from "aws-cdk-lib";
import { DeduplicationScope, FifoThroughputLimit, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { z } from "zod";
import { queueCdkTemplate, QueueInfoTemplate } from "./queueCdkTemplate";

const supportedTypes=['queue'];

const QueuePluginConfig=z.object(
{
    /**
     * @default "Queues"
     */
    queueCdkConstructClassName:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the user pool
     */
    queueCdkConstructFile:z.string().optional(),
})

export const queuePlugin:ProtoPipelineConfigurablePlugin<typeof QueuePluginConfig>=
{
    configScheme:QueuePluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        libStyle,
        paramMap,
        paramPackage,
        importMap
    },{
        queueCdkConstructClassName='Queues',
        queueCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${queueCdkConstructClassName}.ts`:undefined,
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        for(const node of supported){
            protoAddContextParam(node.name,paramPackage,paramMap,importMap);
        }

        if(queueCdkConstructFile){
            outputs.push({
                path:queueCdkConstructFile,
                content:queueCdkTemplate(queueCdkConstructClassName,supported.map<QueueInfoTemplate>(q=>{
                    const targets=protoGetChildrenByName(q,'target',false).map(t=>t.value).filter(v=>typeof v === 'string') as string[];
                    const info:QueueInfoTemplate={
                        name:q.name,
                        target:targets,
                        dlq:q.children?.['dlq']?true:undefined,
                        dlqMaxReceiveCount:safeParseNumberOrUndefined(q.children?.['dlqMaxReceiveCount']?.value),
                        batchSize:safeParseNumberOrUndefined(q.children?.['batchSize']?.value),
                        grantAccess:true,
                        arnParam:protoGetParamName(q.name),

                        contentBasedDeduplication:q.children?.['contentBasedDeduplication']?true:undefined,
                        dataKeyReuse:secondsToCdkDuration(q.children?.['dataKeyReuseSeconds']?.value),
                        deduplicationScope:q.children?.['enableDql']?.value as (DeduplicationScope|undefined),
                        deliveryDelay:secondsToCdkDuration(q.children?.['deliveryDelaySeconds']?.value),
                        encryption:q.children?.['encryption']?.value as (QueueEncryption|undefined),
                        //encryptionMasterKey:,
                        enforceSSL:q.children?.['enforceSSL']?true:undefined,
                        fifo:q.children?.['fifo']?true:undefined,
                        fifoThroughputLimit:q.children?.['fifoThroughputLimit']?.value as (FifoThroughputLimit|undefined),
                        maxMessageSizeBytes:safeParseNumberOrUndefined(q.children?.['maxMessageSizeBytes']?.value),
                        queueName:q.children?.['queueName']?.value,
                        receiveMessageWaitTime:secondsToCdkDuration(q.children?.['receiveMessageWaitTimeSeconds']?.value),
                        removalPolicy:q.children?.['removalPolicy']?.value as (RemovalPolicy|undefined),
                        retentionPeriod:secondsToCdkDuration(q.children?.['retentionPeriodSeconds']?.value),
                        visibilityTimeout:safeParseNumberOrUndefined(q.children?.['visibilityTimeoutSeconds']?.value),

                        envPattern:q.children?.['$envPattern']?.value,
                    }
                    return info;
                }),importMap)
            })
        }
    }
}
