import { Observable, Subject } from "rxjs";
import { ConvoError } from "./ConvoError";
import { ConvoExecutionContext } from "./ConvoExecutionContext";
import { containsConvoTag, convoDisableAutoCompleteName, convoResultReturnName, convoTags, escapeConvoMessageContent, spreadConvoArgs } from "./convo-lib";
import { parseConvoCode } from "./convo-parser";
import { ConvoCompletion, ConvoCompletionMessage, ConvoCompletionService, ConvoFunction, ConvoMessage, ConvoParsingResult, ConvoScopeFunction, FlatConvoConversation, FlatConvoMessage } from "./convo-types";
import { convoCompletionService } from "./convo.deps";

export interface ConversationOptions
{
    userRoles?:string[];
    roleMap?:Record<string,string>;
    completionService?:ConvoCompletionService;
}

export class Conversation
{
    private _convo:string[]=[];
    public get convo(){return this._convo.join('\n\n')}
    public getConvoStrings(){
        return [...this._convo];
    }

    private _messages:ConvoMessage[]=[];

    private readonly _onMessagesChanged=new Subject<void>();
    public get onMessagesChanged():Observable<void>{return this._onMessagesChanged}


    public userRoles:string[];
    public roleMap:Record<string,string>

    private readonly completionService?:ConvoCompletionService;

    public constructor({
        userRoles=['user'],
        roleMap={},
        completionService=convoCompletionService.get(),
    }:ConversationOptions={}){
        this.userRoles=userRoles;
        this.roleMap=roleMap;
        this.completionService=completionService;
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
    }

    public append(messages:string,mergeWithPrev=false):ConvoParsingResult{
        const r=parseConvoCode(messages);
        if(r.error){
            throw r.error
        }
        if(mergeWithPrev && this._convo.length){
            this._convo[this._convo.length-1]+='\n'+messages;
        }else{
            this._convo.push(messages);
        }

        if(r.result){
            for(const m of r.result){
                this._messages.push(m);
            }
        }

        this._onMessagesChanged.next();

        return r;
    }

    /**
     * Submits the current conversation and optionally appends messages to the conversation before
     * submitting.
     * @param append Optional message to append before submitting
     */
    public async completeAsync(append?:string):Promise<ConvoCompletion>{
        if(append){
            this.append(append);
        }

        const completionService=this.completionService;

        return await this._completeAsync(flat=>completionService?.completeConvoAsync(flat)??[])

    }

    public async callFunctionAsync(fn:ConvoFunction|string,args:Record<string,any>={}):Promise<any>
    {
        const c=await this._completeAsync(flat=>{

            if(typeof fn === 'object'){
                flat.exe.loadFunctions([{
                    fn,
                    role:'function'
                }])
            }

            return [{
                callFn:typeof fn==='string'?fn:fn.name,
                callParams:args

            }]
        })

        return c.returnValues?.[0];
    }

    private async _completeAsync(
        getCompletion:(flat:FlatConvoConversation)=>Promise<ConvoCompletionMessage[]>|ConvoCompletionMessage[],
        autoCompleteFunctionReturns=true,
        prevCompletion?:ConvoCompletionMessage[],
        preReturnValues?:any[]
    ):Promise<ConvoCompletion>{

        let append:string[]|undefined=undefined;
        const flat=await this.flattenAsync(new ConvoExecutionContext({
            conversation:this,
            convoPipeSink:(value)=>{
                if(!(typeof value === 'string')){
                    value=value?.toString();
                    if(!value?.trim()){
                        return value;
                    }
                }
                if(!append){
                    append=[];
                }
                append.push(value);
                return value;
            }
        }));
        if(this._isDisposed){
            return {messages:[]}
        }

        const completion=await getCompletion(flat);

        const exe=flat.exe;
        let cMsg:ConvoCompletionMessage|undefined=undefined;

        let returnValues:any[]|undefined=undefined;

        let lastResultValue:any=undefined;

        for(const msg of completion){

            if(msg.content){
                cMsg=msg;
                this.append(`> ${this.getReversedMappedRole(msg.role)}\n${escapeConvoMessageContent(msg.content)}\n`);
            }

            if(msg.callFn){
                const result=this.append(`> call ${msg.callFn}(${msg.callParams===undefined?'':spreadConvoArgs(msg.callParams,true)})`);
                const callMessage=result.result?.[0];
                if(result.result?.length!==1 || !callMessage){
                    throw new ConvoError(
                        'function-call-parse-count',
                        {completion:msg},
                        'failed to parse function call. Exactly 1 function call should have been parsed'
                    );
                }
                exe.clearSharedSetters();
                if(!callMessage.fn?.call){
                    continue;
                }
                const callResult=await exe.executeFunctionResultAsync(callMessage.fn);
                const callResultValue=callResult.valuePromise?(await callResult.valuePromise):callResult.value;
                const target=this._messages.find(m=>m.fn && !m.fn.call && m.fn?.name===callMessage.fn?.name);
                const disableAutoComplete=(
                    exe.getVar(convoDisableAutoCompleteName,undefined,callResult.scope,false)===true ||
                    containsConvoTag(target?.tags,convoTags.disableAutoComplete)
                )
                if(!returnValues){
                    returnValues=[];
                }
                returnValues.push(callResultValue);

                lastResultValue=(typeof callResultValue === 'function')?undefined:callResultValue;

                const lines:string[]=['> result'];
                if(exe.sharedSetters){
                    for(const s of exe.sharedSetters){
                        lines.push(`${s}=${JSON.stringify(exe.sharedVars[s])}`)
                    }
                }
                lines.push(`${convoResultReturnName}=${JSON.stringify(lastResultValue)}`)
                lines.push('');
                this.append(lines.join('\n'),true);

                if(disableAutoComplete){
                    lastResultValue=undefined;
                }

            }

        }

        if(prevCompletion){
            completion.unshift(...prevCompletion);
        }
        if(preReturnValues){
            if(returnValues){
                returnValues.unshift(...preReturnValues);
            }else{
                returnValues=preReturnValues;
            }
        }

        if(append){
            for(const a of (append as string[])){
                this.append(a);
            }
        }else if(lastResultValue!==undefined && autoCompleteFunctionReturns){
            return await this._completeAsync(getCompletion,false,completion,returnValues);
        }

        return {
            message:cMsg,
            messages:completion,
            exe,
            returnValues,
        }
    }

    public getReversedMappedRole(role:string|null|undefined):string{
        if(!role){
            return 'user';
        }
        for(const e in this.roleMap){
            if(this.roleMap[e]===role){
                return e;
            }
        }
        return role;
    }

    public getMappedRole(role:string|null|undefined):string{
        if(!role){
            return 'user';
        }
        return this.roleMap[role]??role;
    }

    public externFunctions:Record<string,ConvoScopeFunction>={}

    public async flattenAsync(
        exe:ConvoExecutionContext=new ConvoExecutionContext({conversation:this})
    ):Promise<FlatConvoConversation>{

        const messages:FlatConvoMessage[]=[];

        exe.loadFunctions(this._messages,this.externFunctions);

        for(let i=0;i<this._messages.length;i++){
            const msg=this._messages[i];
            if(!msg){
                continue;
            }
            const flat:FlatConvoMessage={
                role:this.getMappedRole(msg.role)
            }
            if(msg.fn){
                if(msg.fn.local || msg.fn.call){
                    continue;
                }else if(msg.fn.topLevel){
                    const r=exe.executeFunction(msg.fn);
                    if(r.valuePromise){
                        await r.valuePromise;
                    }
                    const prev=this._messages[i-1];
                    if(msg.role==='result' && prev?.fn?.call){
                        flat.role='function';
                        flat.called=prev.fn;
                        flat.calledReturn=exe.getVar(convoResultReturnName,undefined,undefined,false);
                        flat.calledParams=exe.getConvoFunctionArgsValue(prev.fn);
                    }else{
                        continue;
                    }
                }else{
                    flat.role='function';
                    flat.fn=msg.fn;
                    flat.fnParams=exe.getConvoFunctionArgsScheme(msg.fn);
                }
            }else if(msg.statement){
                const r=exe.executeStatement(msg.statement);
                let value:any;
                if(r.valuePromise){
                    value=await r.valuePromise;
                }else{
                    value=r.value;
                }
                if(typeof value === 'string'){
                    flat.content=value;
                }else{
                    flat.content=value?.toString()??'';
                }

            }else if(msg.content!==undefined){
                flat.content=msg.content;
            }else{
                continue;
            }
            messages.push(flat);
        }

        return {
            exe,
            messages,
            conversation:this
        }
    }
}
