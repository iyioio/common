import { ChromeMessage, ChromeMessageListener, addChromeMessageListener, removeChromeMessageListener, sendChromeMessage, sendReceiveChromeMessageAsync } from '@iyio/chrome-common';
import { DisposeContainer, ReadonlySubject, pushBehaviorSubjectAry, shortUuid } from "@iyio/common";
import { BehaviorSubject } from 'rxjs';
import { TaskCtrl } from './TaskCtrl';
import { CcMsg, CcMsgType, ConvoTaskState } from './convo-chrome-types';

export abstract class BaseConvoChromeCtrl
{

    private tabIds:number[]=[];

    public addTab(id:number){
        this.tabIds.push(id);
    }

    private readonly _tasks:BehaviorSubject<TaskCtrl[]>=new BehaviorSubject<TaskCtrl[]>([]);
    public get tasksSubject():ReadonlySubject<TaskCtrl[]>{return this._tasks}
    public get tasks(){return this._tasks.value}

    private readonly messageListener:ChromeMessageListener;
    public constructor()
    {

        this.messageListener={
            callbackEx:this._onMessage
        }
        addChromeMessageListener(this.messageListener);
    }

    private readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
        removeChromeMessageListener(this.messageListener);
    }

    private readonly _onMessage=(_msg:ChromeMessage,sender?:chrome.runtime.MessageSender):void=>{
        const msg=_msg as CcMsg;
        console.log('hio 👋 👋 👋 BaseConvoChromeCtrl msg',msg);
        this.onMessage(msg,sender);
    }

    protected abstract onMessage(msg:CcMsg,sender?:chrome.runtime.MessageSender):void;


    public startTask(prompt:string){
        const msg:CcMsg={
            taskId:shortUuid(),
            type:'startTask',
            data:prompt,
        }
        sendChromeMessage(msg);
    }

    protected addTask(task:ConvoTaskState):TaskCtrl;
    protected addTask(id:string,userPrompt:string):TaskCtrl;
    protected addTask(idOrTask:string|ConvoTaskState,userPrompt?:string):TaskCtrl{

        if(typeof idOrTask !== 'object'){
            if(!userPrompt){
                throw new Error('userPrompt required')
            }
            idOrTask={
                id: idOrTask,
                userPrompt,
                convo:'',
                active:true,
            }
        }

        if(this.hasTask(idOrTask.id)){
            throw new Error(`Task already exists with id ${idOrTask}`);
        }
        const ctrl=new TaskCtrl({task:idOrTask,parentCtrl:this})
        pushBehaviorSubjectAry(this._tasks,ctrl);
        this.runTaskAsync(ctrl);
        return ctrl;
    }

    public hasTask(id:string){
        return this._tasks.value.some(t=>t.id===id);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected runTaskAsync(task:TaskCtrl):Promise<void>{
        return Promise.resolve();
    }

    public sendMessage(msg:CcMsg,responseTo?:CcMsg){
        if(responseTo){
            msg={
                resultId:responseTo.requestId,
                taskId:responseTo.taskId,
                ...msg
            }
        }
        sendChromeMessage(msg,this.tabIds);
    }

    public async sendReceiveMessageAsync<
        TSend extends CcMsgType,
        TReceive extends CcMsgType,
        TReceiveObj=Extract<CcMsg,{type:TReceive}>,
    >(
        taskId:string|null|undefined,
        sendType:Extract<CcMsg,{type:TSend}> extends {data:any}?never:TSend,
        receiveType:Extract<CcMsg,{type:TReceive}> extends {data:any}?TReceive:never,
    ):Promise<TReceiveObj extends {data:any}?TReceiveObj['data']:never>{

        const r=await sendReceiveChromeMessageAsync({
            taskId:taskId??undefined,
            type:sendType,
        },receiveType,this.tabIds);

        return r.data;
    }

    public async sendReceiveMessageWithDataAsync<
        TSend extends CcMsgType,
        TReceive extends CcMsgType,
        TSendObj=Extract<CcMsg,{type:TSend}>,
        TReceiveObj=Extract<CcMsg,{type:TReceive}>,
    >(
        taskId:string|null|undefined,
        sendType:Extract<CcMsg,{type:TSend}> extends {data:any}?TSend:never,
        receiveType:Extract<CcMsg,{type:TReceive}> extends {data:any}?TReceive:never,
        sendData:TSendObj extends {data:any}?TSendObj['data']:never
    ):Promise<TReceiveObj extends {data:any}?TReceiveObj['data']:never>{

        const r=await sendReceiveChromeMessageAsync({
            taskId:taskId??undefined,
            type:sendType,
            data:sendData
        },receiveType,this.tabIds);

        return r.data;
    }

}
