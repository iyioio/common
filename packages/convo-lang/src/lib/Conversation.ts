import { delayAsync } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { ConvoError } from "./ConvoError";
import { ConvoExecutionContext } from "./ConvoExecutionContext";
import { containsConvoTag, convoDescriptionToComment, convoDisableAutoCompleteName, convoLabeledScopeParamsToObj, convoResultReturnName, convoTags, escapeConvoMessageContent, spreadConvoArgs, validateConvoFunctionName, validateConvoTypeName, validateConvoVarName } from "./convo-lib";
import { parseConvoCode } from "./convo-parser";
import { ConvoAppend, ConvoCompletion, ConvoCompletionMessage, ConvoCompletionService, ConvoDefItem, ConvoFunction, ConvoFunctionDef, ConvoMessage, ConvoMessageAndOptStatement, ConvoParsingResult, ConvoScopeFunction, ConvoTypeDef, ConvoVarDef, FlatConvoConversation, FlatConvoMessage } from "./convo-types";
import { schemeToConvoTypeString } from "./convo-zod";
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
    public get messages(){return this._messages}

    private readonly _onAppend=new Subject<ConvoAppend>();
    public get onAppend():Observable<ConvoAppend>{return this._onAppend}


    public userRoles:string[];
    public roleMap:Record<string,string>

    private completionService?:ConvoCompletionService;

    public readonly externFunctions:Record<string,ConvoScopeFunction>={}

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

    public autoUpdateCompletionService()
    {
        if(!this.completionService){
            this.completionService=convoCompletionService.get();
        }
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

        this._onAppend.next({
            text:messages,
            messages:r.result??[]
        });

        return r;
    }

    public appendDefine(defineCode:string,description?:string):ConvoParsingResult{
        return this.append((description?convoDescriptionToComment(description)+'\n':'')+'> define\n'+defineCode);
    }

    public appendTopLevel(defineCode:string,description?:string):ConvoParsingResult{
        return this.append((description?convoDescriptionToComment(description)+'\n':'')+'> do\n'+defineCode);
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
                if( (typeof lastResultValue === 'string') &&
                    lastResultValue.length>50 &&
                    lastResultValue.includes('\n') &&
                    !lastResultValue.includes('---')
                ){
                    lines.push(`${convoResultReturnName}=---\n${lastResultValue}\n---`)
                }else{
                    lines.push(`${convoResultReturnName}=${JSON.stringify(lastResultValue)}`)
                }
                lines.push('');
                this.append(lines.join('\n'),true);
                await delayAsync(5000)

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

    private readonly definitionItems:ConvoDefItem[]=[];

    public define(items:ConvoDefItem|(ConvoDefItem[]),override?:boolean):ConvoParsingResult|undefined
    {

        let original=true;
        if(!Array.isArray(items)){
            original=false;
            items=[items];
        }

        const startLength=items.length;
        for(let i=0;i<startLength;i++){
            const item=items[i];
            if(!item){continue}

            if(item.types){
                if(original){
                    items=[...items];
                    original=false;
                }
                for(const e in item.types){
                    const type=item.types[e];
                    if(type){
                        items.push({type:{name:e,type:type}})
                    }
                }
            }

            if(item.vars){
                if(original){
                    items=[...items];
                    original=false;
                }
                for(const e in item.vars){
                    items.push({var:{name:e,value:item.vars[e]}})
                }
            }

            if(item.fns){
                if(original){
                    items=[...items];
                    original=false;
                }
                for(const e in item.fns){
                    const fn=item.fns[e];
                    if(typeof fn === 'object'){
                        items.push({fn:{name:e,...fn}})
                    }else if(fn){
                        items.push({fn:{
                            name:e,
                            local:true,
                            callback:fn
                        }})
                    }
                }
            }
        }


        const out:string[]=[];
        for(let i=0;i<items.length;i++){
            const type=items[i]?.type;
            if(!type || (!override && this.getAssignment(type.name))){
                continue
            }

            validateConvoTypeName(type.name);

            const str=schemeToConvoTypeString(type.type,type.name);
            if(!str){
                continue;
            }
            out.push(str);
            out.push('\n');
            this.definitionItems.push({type});
        }

        for(let i=0;i<items.length;i++){
            const v=items[i]?.var;
            if(!v || (!override && this.getAssignment(v.name))){
                continue
            }

            validateConvoVarName(v.name);

            out.push(`${v.name} = ${JSON.stringify(v.value)}`);
            out.push('\n');
            this.definitionItems.push({var:v});
        }

        if(out.length){
            out.unshift('> define\n')
        }

        for(let i=0;i<items.length;i++){
            const fn=items[i]?.fn;
            if(!fn || (!override && this.getAssignment(fn.name))){
                continue
            }

            validateConvoFunctionName(fn.name);

            if(out.length){
                out.push('\n');
            }
            if(fn.registerOnly){
                if(fn.local===false){
                    throw new ConvoError('invalid-register-only-function',undefined,'Register only functions can only be local');
                }
                this.createFunctionImpl(fn);
            }else{
                out.push(this.createFunctionImpl(fn));
                out.push('\n');
            }
        }

        return out.length?this.append(out.join('')):undefined;
    }

    public defineType(type:ConvoTypeDef,override?:boolean):ConvoParsingResult|undefined{
        return this.define([{type}],override);
    }

    public defineTypes(types:ConvoTypeDef[],override?:boolean):ConvoParsingResult|undefined{
        return this.define(types.map(type=>({type})),override);
    }

    public defineVar(variable:ConvoVarDef,override?:boolean):ConvoParsingResult|undefined{
        return this.define([{var:variable}],override);

    }

    public defineVars(vars:ConvoVarDef[],override?:boolean):ConvoParsingResult|undefined{
        return this.define(vars.map(v=>({var:v})),override);
    }

    public defineFunction(fn:ConvoFunctionDef,override?:boolean){
        return this.define([{fn}],override);
    }

    public defineFunctions(fns:ConvoFunctionDef[],override?:boolean){
        return this.define(fns.map(fn=>({fn})),override);
    }

    private createFunctionImpl(fnDef:ConvoFunctionDef):string{
        const params=fnDef.paramsType??fnDef.paramsJsonScheme;
        const fnSig=(
            (fnDef.disableAutoComplete?`@${convoTags.disableAutoComplete}\n`:'')+
            (fnDef.description?convoDescriptionToComment(fnDef.description)+'\n':'')+
            (params?schemeToConvoTypeString(params,`>${fnDef.local?' local':''} `+fnDef.name):`>${fnDef.local?' local':''} ${fnDef.name}()`)
        );

        if(fnDef.returnScheme && !this.definitionItems.some(t=>t.type===fnDef.returnScheme)){
            this.defineType(fnDef.returnScheme);
        }

        if(fnDef.body){
            if(fnDef.registerOnly){
                throw new ConvoError('invalid-register-only-function',undefined,'Register only function are not allowed to define a body')
            }
            const returnType=fnDef.returnScheme?.name??fnDef.returnTypeName;
            return `${fnSig} ->${returnType?' '+returnType:''} (\n${fnDef.body}\n)`;
        }else{
            if(fnDef.scopeCallback){
                this.externFunctions[fnDef.name]=fnDef.scopeCallback;
            }else if(fnDef.callback){
                const callback=fnDef.callback;
                if(fnDef.paramsJsonScheme || fnDef.paramsType){
                    this.externFunctions[fnDef.name]=(scope)=>{
                        return callback(convoLabeledScopeParamsToObj(scope));
                    }
                }else{
                    this.externFunctions[fnDef.name]=(scope)=>{
                        return callback(scope.paramValues?.[0]);
                    }
                }

            }
            return fnSig;
        }
    }

    public getAssignment(name:string,excludePreAssigned=false):ConvoMessageAndOptStatement|undefined{
        return (
            this._getAssignment(name,this._messages)??
            (excludePreAssigned?undefined:this._getAssignment(name,this.preAssignMessages))
        )
    }

    private _getAssignment(name:string,messages:ConvoMessage[]):ConvoMessageAndOptStatement|undefined{
        for(let i=messages.length-1;i>-1;i--){
            const message=messages[i];
            if(!message?.fn){continue}

            if(message.fn.topLevel){
                if(!message.fn.body){
                    continue;
                }
                for(let b=0;b<message.fn.body.length;b++){
                    const statement=message.fn.body[b];
                    if(!statement){continue}

                    if(statement.set===name && !statement.setPath){
                        return {message,statement}
                    }
                }
            }else{
                if(!message.fn.call && message.fn.name===name){
                    return {message};
                }
            }
        }
        return undefined;
    }


    private preAssignMessages:ConvoMessage[]=[];
    /**
     * Used to mark variables, types and function as assigned before actually appending the code.
     */
    public preAssign(convoCode:string){
        const r=parseConvoCode(convoCode);
        if(r.error){
            throw new Error(r.error.message);
        }
        if(r.result){
            for(const m of r.result){
                this.preAssignMessages.push(m);
            }
        }
    }
}

