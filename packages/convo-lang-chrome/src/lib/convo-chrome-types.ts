export interface ConvoTaskState
{
    id:string;
    userPrompt:string;
    convo:string;
    active:boolean;
}

export interface ConvoActionState
{
    id:string;
    created:number;
    items:ActionItem[];
}

export interface ActionItem
{
    id:string;
    type:string;
    x:number;
    y:number;
    w:number;
    h:number;
    elem?:Element;
    text:string;
}

export interface ExecuteAction{

    actionStateId:string;

    actionType:"click"|"enterText";

    targetId:string;

    text?:string;
}

export interface ExecuteActionResult
{
    success:boolean;
    errorMessage?:string;
}

export type CcMsg={
    taskId?:string;
    to?:string;
    requestId?:string;
    resultId?:string;
}&(
    {
    type:'startTask';
        data:string;
    }|{
        type:'getState';
    }|{
        type:'returnState';
        data:ConvoTaskState;
    }|{
        type:'getActionState';
    }|{
        type:'returnActionState';
        data:ConvoActionState;
    }|{
        type:'executeAction';
        data:ExecuteAction;
    }|{
        type:'executeActionResult';
        data:ExecuteActionResult;
    }
)

export type CcMsgType=CcMsg['type'];
