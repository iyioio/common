import { DeleteMessageBatchCommand, DeleteMessageCommand, ReceiveMessageCommand, SQSClient, SQSClientConfig, SendMessageCommand } from "@aws-sdk/client-sqs";
import { AwsAuthProviders, awsRegionParam } from "@iyio/aws";
import { AuthDependentClient, IQueueClient, QueueMessage, QueueMessageCollection, QueuePullRequest, QueuePushRequest, QueuePushResult, Scope, ValueCache, authService } from "@iyio/common";
import { getSqsUrl } from "./sqs-lib";

export class SqsQueueClient extends AuthDependentClient<SQSClient> implements IQueueClient
{
    public readonly clientName='SQS';



    public static fromScope(scope:Scope)
    {
        return new SqsQueueClient({
            region:awsRegionParam(scope),
            credentials:scope.get(AwsAuthProviders)?.getAuthProvider()
        },authService(scope).userDataCache)
    }

    public readonly clientConfig:Readonly<SQSClientConfig>;

    public constructor(
        clientConfig:SQSClientConfig,
        userDataCache:ValueCache<any>
    ){
        super(userDataCache);
        this.clientConfig=clientConfig;
    }

    protected override createAuthenticatedClient():SQSClient{
        return new SQSClient(this.clientConfig);
    }

    public async pushAsync(request:QueuePushRequest):Promise<QueuePushResult|null>
    {
        const url=getSqsUrl(request.queueName);
        if(!url){
            return null;
        }
        const r=await this.getClient().send(new SendMessageCommand({
            QueueUrl:url,
            MessageBody:JSON.stringify(request.value)
        }));

        return {
            messageId:r.MessageId
        };
    }

    public async pullAsync({
        queueName,
        maxValueCount=10,
        autoDelete,
        timeoutSeconds=20,
        hideSeconds=20,
    }:QueuePullRequest):Promise<QueueMessageCollection|null>
    {
        const url=getSqsUrl(queueName);
        if(!url){
            return null;
        }
        const r=await this.getClient().send(new ReceiveMessageCommand({
            QueueUrl:url,
            MaxNumberOfMessages:maxValueCount,
            WaitTimeSeconds:timeoutSeconds,
            VisibilityTimeout:hideSeconds
        }));

        if(!r.Messages){
            return {
                messages:[],
                deleteMessageAsync(){
                    return Promise.resolve();
                },
                deleteAllMessagesAsync(){
                    return Promise.resolve();
                },
            }
        }

        const deleteMessageAsync=async (message:QueueMessage):Promise<void>=>{
            try{
                await this.getClient().send(new DeleteMessageCommand({
                    QueueUrl:url,
                    ReceiptHandle:message.handle,
                }));
            }catch(ex){
                console.error('Failed to delete message of queue message collection',ex)
            }
        }
        const deleteAllMessagesAsync=async ():Promise<void>=>{
            if(!r.Messages){
                return;
            }
            try{
                await this.getClient().send(new DeleteMessageBatchCommand({
                    QueueUrl:url,
                    Entries:r.Messages.map((message)=>({
                        Id:message.MessageId,
                        ReceiptHandle:message.ReceiptHandle,
                    })),
                }));
            }catch(ex){
                console.error('Failed to delete all messages of queue message collection',ex)
            }
        }

        if(autoDelete){
            await deleteAllMessagesAsync();
        }

        return {
            messages:r.Messages.map(r=>({
                id:r.MessageId,
                value:r.Body?JSON.parse(r.Body):undefined,
                handle:r.ReceiptHandle
            })),
            deleteMessageAsync,
            deleteAllMessagesAsync,
        }
    }
}
