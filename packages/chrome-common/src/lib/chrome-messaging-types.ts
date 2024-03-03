export interface ChromeMessage
{
    type:string;
    to?:string;
    data?:any;
    requestId?:string;
    resultId?:string;
    taskId?:string;
}


export interface ChromeMessageListener
{

    callback?:(msg:ChromeMessage)=>void;

    callbackEx?:(msg:ChromeMessage,sender?:chrome.runtime.MessageSender)=>void;

    /**
     * If true the listener will be removed after it is triggered
     */
    autoRemove?:boolean;

    /**
     * Filters received messages by their `type` property
     */
    type?:string;
    /**
     * Filters received messages by their `type` property
     */
    to?:string;

    /**
     * Filters received messages by their `resultId` property
     */
    resultId?:string;

    /**
     * Filters received messages by their `taskId` property
     */
    taskId?:string;
}
