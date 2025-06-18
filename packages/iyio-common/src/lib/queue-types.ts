export interface QueuePullRequest
{
    queueName:string;
    /**
     * The max number of messages to receive.
     * @default 10
     */
    maxValueCount?:number;

    /**
     * If true received messages will be immediately deleted.
     */
    autoDelete?:boolean;

    /**
     * The max number of seconds to wait for messages
     * @default 20
     */
    timeoutSeconds?:number;

    /**
     * The number of seconds the return messages are hidden in the queue preventing other
     * queue clients from receiving the message. Once a message is done
     * @default 20
     */
    hideSeconds?:number;
}

export interface QueueMessageCollection
{
    messages:QueueMessage[];
    deleteMessageAsync(message:QueueMessage):Promise<void>;
    deleteAllMessagesAsync():Promise<void>;
}

export interface QueueMessage
{
    id?:string;
    handle?:any;
    value:any;
}

export interface QueuePushRequest
{
    queueName:string;
    value:any;
    delayMs?:number;
}

export interface QueuePushResult
{
    messageId?:string;
}

export interface IQueueClient
{

    readonly clientName:string;

    pushAsync?(request:QueuePullRequest):Promise<QueuePushResult|null>;

    pullAsync?(request:QueuePullRequest):Promise<QueueMessageCollection|null>;
}
