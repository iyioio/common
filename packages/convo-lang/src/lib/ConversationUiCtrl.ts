import { ReadonlySubject, aryDuplicateRemoveItem, shortUuid } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { Conversation, ConversationOptions } from "./Conversation";
import { LocalStorageConvoDataStore } from "./LocalStorageConvoDataStore";
import { getConvoPromptImageUrl } from "./convo-lang-ui-lib";
import { ConvoDataStore, ConvoMessageRenderResult, ConvoMessageRenderer, ConvoPromptImage } from "./convo-lang-ui-types";
import { FlatConvoMessage } from "./convo-types";

export type ConversationUiCtrlTask='completing'|'loading'|'clearing'|'disposed';

export interface ConversationUiCtrlOptions
{
    id?:string;
    /**
     * If true and an id is given the conversation will be auto loaded.
     */
    autoLoad?:boolean;
    template?:string;
    convo?:Conversation;
    convoOptions?:ConversationOptions;
    initConvo?:(convo:Conversation)=>void;
    autoSave?:boolean;
    store?:null|'localStorage'|ConvoDataStore;
}

export class ConversationUiCtrl
{

    public readonly id:string;

    public readonly autoSave:boolean;

    private readonly store:null|ConvoDataStore;

    private readonly convoOptions?:ConversationOptions;
    private readonly initConvo?:(convo:Conversation)=>void;

    private readonly tasks:ConversationUiCtrlTask[]=[];
    private readonly _currentTask:BehaviorSubject<ConversationUiCtrlTask|null>=new BehaviorSubject<ConversationUiCtrlTask|null>(null);
    public get currentTaskSubject():ReadonlySubject<ConversationUiCtrlTask|null>{return this._currentTask}
    public get currentTask(){return this._currentTask.value}

    private readonly _template:BehaviorSubject<string|undefined>;
    public get templateSubject():ReadonlySubject<string|undefined>{return this._template}
    public get template(){return this._template.value}
    public set template(value:string|undefined){
        if(value==this._template.value){
            return;
        }
        this._template.next(value);
    }

    private readonly _convo:BehaviorSubject<Conversation|null>;
    public get convoSubject():ReadonlySubject<Conversation|null>{return this._convo}
    public get convo(){return this._convo.value}

    private readonly _showSource:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get showSourceSubject():ReadonlySubject<boolean>{return this._showSource}
    /**
     * If true the source convo-lang syntax should be displayed to the user
     */
    public get showSource(){return this._showSource.value}
    public set showSource(value:boolean){
        if(value==this._showSource.value){
            return;
        }
        this._showSource.next(value);
    }

    private readonly _showSystemMessages:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get showSystemMessagesSubject():ReadonlySubject<boolean>{return this._showSystemMessages}
    /**
     * If true the system messages should be displayed to the user
     */
    public get showSystemMessages(){return this._showSystemMessages.value}
    public set showSystemMessages(value:boolean){
        if(value==this._showSystemMessages.value){
            return;
        }
        this._showSystemMessages.next(value);
    }

    private readonly _showFunctions:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get showFunctionsSubject():ReadonlySubject<boolean>{return this._showFunctions}
    /**
     * If true function calls should be displayed to the user
     */
    public get showFunctions(){return this._showFunctions.value}
    public set showFunctions(value:boolean){
        if(value==this._showFunctions.value){
            return;
        }
        this._showFunctions.next(value);
    }

    private readonly _enabledSlashCommands:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get enabledSlashCommandsSubject():ReadonlySubject<boolean>{return this._enabledSlashCommands}
    /**
     * If messages appended to the conversation using the appendUiMessage will be checked for messages
     * starting with a forward slash and be interpreted as a command.
     */
    public get enabledSlashCommands(){return this._enabledSlashCommands.value}
    public set enabledSlashCommands(value:boolean){
        if(value==this._enabledSlashCommands.value){
            return;
        }
        this._enabledSlashCommands.next(value);
    }

    private readonly _theme:BehaviorSubject<Record<string,any>>=new BehaviorSubject<Record<string,any>>({});
    public get themeSubject():ReadonlySubject<Record<string,any>>{return this._theme}
    public get theme(){return this._theme.value}
    public set theme(value:Record<string,any>){
        if(value==this._theme.value){
            return;
        }
        this._theme.next(value);
    }

    private readonly _queueImages:BehaviorSubject<(string|ConvoPromptImage)[]>=new BehaviorSubject<(string|ConvoPromptImage)[]>([]);
    public get queueImagesSubject():ReadonlySubject<readonly (string|ConvoPromptImage)[]>{return this._queueImages as any}
    public get queueImages():readonly (string|ConvoPromptImage)[]{return this._queueImages.value}

    public constructor({
        id,
        autoLoad,
        convo,
        initConvo,
        convoOptions,
        template,
        autoSave=false,
        store='localStorage',
    }:ConversationUiCtrlOptions={}){

        this.id=id??shortUuid();

        this.convoOptions=convoOptions;
        this.initConvo=initConvo;

        this._template=new BehaviorSubject(template);

        this.autoSave=autoSave;
        this.store=store==='localStorage'?
            new LocalStorageConvoDataStore():store;



        if(id!==undefined && autoLoad){
            this._convo=new BehaviorSubject<Conversation|null>(convo??null);
            this.loadAsync();
        }else{
            this._convo=new BehaviorSubject<Conversation|null>(convo??this.createConvo(true));
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this._currentTask.next('disposed');
    }

    private createConvo(appendTemplate:boolean){
        const convo=new Conversation(this.convoOptions);
        if(this.initConvo){
            this.initConvo(convo);
        }
        if(appendTemplate && this.template){
            convo.append(this.template);
        }
        return convo;
    }

    public async loadAsync():Promise<boolean>{
        if(this.isDisposed || this.currentTask || this.store?.loadConvo){
            return false;
        }
        this.pushTask('loading');
        try{
            const str=await this.store?.loadConvo?.(this.id);
            if(this.isDisposed){
                return false;
            }
            const convo=this.createConvo(str?false:true);
            if(str){
                convo.append(str);
            }
            this._convo.next(convo);

        }finally{
            this.popTask('loading');
        }

        return true;
    }

    public clear(){
        if(this.isDisposed || this.currentTask){
            return false;
        }
        this._convo.next(this.createConvo(true));
        if(this.autoSave){
            this.queueAutoSave();
        }
        return true;
    }

    private pushTask(task:ConversationUiCtrlTask){
        this.tasks.push(task);
        if(this._currentTask.value!==task){
            this._currentTask.next(task);
        }
    }

    private popTask(task:ConversationUiCtrlTask){
        if(this.isDisposed){
            return;
        }
        const i=this.tasks.lastIndexOf(task);
        if(i===-1){
            console.error(`ConversationUiCtrl.popTask out of sync. (${task}) not in current list`);
            return;
        }
        this.tasks.splice(i,1);
        const next=this.tasks[this.tasks.length-1]??null;
        if(this._currentTask.value!==next){
            this._currentTask.next(next);
        }
    }


    public replace(convo:string):boolean{
        if(this.isDisposed || this.currentTask){
            return false;
        }

        const c=this.createConvo(false);
        c.append(convo);

        this._convo.next(c);

        if(this.autoSave){
            this.queueAutoSave();
        }

        return true;
    }

    public async replaceAndCompleteAsync(convo:string){
        if(!this.replace(convo)){
            return false;
        }
        if(this.currentTask){
            return false;
        }
        this.pushTask('completing');

        try{
            await this.convo?.completeAsync();
        }finally{
            this.popTask('completing');
        }

        if(this.autoSave){
            this.queueAutoSave();
        }
        return true;
    }
    public async appendUiMessageAsync(message:string):Promise<boolean|'command'>{

        if(this.isDisposed){
            return false;
        }


        if(cmdReg.test(message)){
            if(!this._enabledSlashCommands.value){
                return false;
            }
            message=message.trim();
            switch(message){

                case '/source':
                    this.showSource=!this.showSource;
                    break;

                case '/system':
                    this.showSystemMessages=!this.showSystemMessages;
                    break;

                case '/function':
                    this.showFunctions=!this.showFunctions;
                    break;

                case '/clear':
                    this.clear();
                    break;
            }
            return 'command';
        }

        const convo=this.convo;
        if(!convo || convo.isCompleting || this.currentTask){
            return false;
        }

        try{

            this.pushTask('completing');

            if(this.queueImages.length){
                message+='\n\n'+this.queueImages.map(i=>{
                    const url=getConvoPromptImageUrl(i);
                    if(!url){
                        return '';
                    }
                    return `![](${encodeURI(url)})`;
                }).join('\n');
                this._queueImages.next([]);
            }

            if(message.trim()){
                convo.appendUserMessage(message);
            }
            await convo.completeAsync();
            if(this.autoSave){
                this.queueAutoSave();
            }
            return true;
        }finally{
            this.popTask('completing');
        }
    }

    public queueImage(image:string|ConvoPromptImage){
        this._queueImages.next([...this._queueImages.value,image]);
    }

    public dequeueImage(image:string|ConvoPromptImage){
        this._queueImages.next(aryDuplicateRemoveItem(this._queueImages.value,image));
    }



    private isAutoSaving=false;
    private autoSaveRequested=false;

    private queueAutoSave(){
        if(this.isDisposed || !this.store){
            return;
        }

        if(this.isAutoSaving){
            this.autoSaveRequested=true;
            return;
        }

        this._autoSaveAsync();
    }

    private async _autoSaveAsync(){
        if(this.isAutoSaving || !this.store){
            return;
        }
        this.isAutoSaving=true;
        do{
            try{
                await this.store?.saveConvo?.(this.id,this.convo?.convo??'');
            }catch(ex){
                console.error('ConversationUiCtrl auto save failed',ex);
            }

        }while(this.autoSaveRequested && !this.isDisposed)
    }

    public renderMessage(message:FlatConvoMessage,index:number):ConvoMessageRenderResult{
        for(const r of this.messageRenderers){
            const v=r(message,index,this);
            if(v!==undefined && v!==null){
                return v;
            }
        }
        return undefined;
    }

    public readonly messageRenderers:ConvoMessageRenderer[]=[];

}

const cmdReg=/^\s*\//;
