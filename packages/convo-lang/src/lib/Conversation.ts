import { ReadonlySubject, delayAsync } from "@iyio/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { ConvoError } from "./ConvoError";
import { ConvoExecutionContext } from "./ConvoExecutionContext";
import { containsConvoTag, convoDescriptionToComment, convoDisableAutoCompleteName, convoLabeledScopeParamsToObj, convoResultReturnName, convoStringToComment, convoTagMapToCode, convoTags, convoTagsToMap, convoUsageTokensToString, convoVars, defaultConvoPrintFunction, defaultConvoVisionSystemMessage, escapeConvoMessageContent, formatConvoMessage, getConvoDateString, parseConvoJsonMessage, spreadConvoArgs, validateConvoFunctionName, validateConvoTypeName, validateConvoVarName } from "./convo-lib";
import { parseConvoCode } from "./convo-parser";
import { ConvoAppend, ConvoCapability, ConvoCompletion, ConvoCompletionMessage, ConvoCompletionService, ConvoDefItem, ConvoFlatCompletionCallback, ConvoFunction, ConvoFunctionDef, ConvoMessage, ConvoMessageAndOptStatement, ConvoMessagePart, ConvoMessagePrefixOptions, ConvoParsingResult, ConvoPrintFunction, ConvoScopeFunction, ConvoStatement, ConvoTypeDef, ConvoVarDef, FlatConvoConversation, FlatConvoMessage } from "./convo-types";
import { convoTypeToJsonScheme, schemeToConvoTypeString } from "./convo-zod";
import { convoCompletionService } from "./convo.deps";
import { createConvoVisionFunction } from "./createConvoVisionFunction";

export interface ConversationOptions
{
    userRoles?:string[];
    roleMap?:Record<string,string>;
    completionService?:ConvoCompletionService;
    serviceCapabilities?:ConvoCapability[];
    capabilities?:ConvoCapability[];
    maxAutoCompleteDepth?:number;
    /**
     * If true time tags will be added to appended user message
     */
    trackTime?:boolean;

    /**
     * If true tokenUsage tags will be added to completed messages
     */
    trackTokens?:boolean;


    /**
     * If true model tags will be added to completed messages
     */
    trackModel?:boolean;

    /**
     * If true the conversation will not automatically be flattened when new message are appended.
     */
    disableAutoFlatten?:boolean;

    /**
     * Number of milliseconds to delay before flattening the conversation. The delay is used to
     * debounce appends.
     */
    autoFlattenDelayMs?:number;

    /**
     * A function that will be used to output debug values. By default debug information is written
     * to the output of the conversation as comments
     */
    debug?:(...values:any[])=>void;

    debugMode?:boolean;
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

    private readonly _activeTaskCount:BehaviorSubject<number>=new BehaviorSubject<number>(0);
    public get activeTaskCountSubject():ReadonlySubject<number>{return this._activeTaskCount}
    public get activeTaskCount(){return this._activeTaskCount.value}

    private readonly _trackTime:BehaviorSubject<boolean>;
    public get trackTimeSubject():ReadonlySubject<boolean>{return this._trackTime}
    public get trackTime(){return this._trackTime.value}
    public set trackTime(value:boolean){
        if(value==this._trackTime.value){
            return;
        }
        this._trackTime.next(value);
    }

    private readonly _trackTokens:BehaviorSubject<boolean>;
    public get trackTokensSubject():ReadonlySubject<boolean>{return this._trackTokens}
    public get trackTokens(){return this._trackTokens.value}
    public set trackTokens(value:boolean){
        if(value==this._trackTokens.value){
            return;
        }
        this._trackTokens.next(value);
    }

    private readonly _trackModel:BehaviorSubject<boolean>;
    public get trackModelSubject():ReadonlySubject<boolean>{return this._trackModel}
    public get trackModel(){return this._trackModel.value}
    public set trackModel(value:boolean){
        if(value==this._trackModel.value){
            return;
        }
        this._trackModel.next(value);
    }

    private readonly _debugMode:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get debugModeSubject():ReadonlySubject<boolean>{return this._debugMode}
    public get debugMode(){return this._debugMode.value}
    public set debugMode(value:boolean){
        if(value==this._debugMode.value){
            return;
        }
        this._debugMode.next(value);
    }

    private readonly _flat:BehaviorSubject<FlatConvoConversation|null>=new BehaviorSubject<FlatConvoConversation|null>(null);
    public get flatSubject():ReadonlySubject<FlatConvoConversation|null>{return this._flat}
    public get flat(){return this._flat.value}



    /**
     * Unregistered variables will be available during execution but will not be added to the code
     * of the conversation. For example the __cwd var is often used to set the current working
     * directory but is not added to the conversation code.
     */
    public readonly unregisteredVars:Record<string,any>={};

    public userRoles:string[];
    public roleMap:Record<string,string>

    private completionService?:ConvoCompletionService;

    public maxAutoCompleteDepth:number;

    public readonly externFunctions:Record<string,ConvoScopeFunction>={};

    /**
     * Capabilities the conversation should support.
     */
    public readonly capabilities:ConvoCapability[];

    /**
     * Capabilities that should be enabled by the underlying completion service.
     */
    public readonly serviceCapabilities:ConvoCapability[];

    private readonly disableAutoFlatten:boolean;

    private readonly autoFlattenDelayMs:number;

    /**
     * A function that will be used to output debug values. By default debug information is written
     * to the output of the conversation as comments
     */
    debug?:(...values:any[])=>void;

    public print:ConvoPrintFunction=defaultConvoPrintFunction;

    public constructor(options:ConversationOptions={}){
        const {
            userRoles=['user'],
            roleMap={},
            completionService=convoCompletionService.get(),
            capabilities=[],
            serviceCapabilities=[],
            maxAutoCompleteDepth=10,
            trackTime=false,
            trackTokens=false,
            trackModel=false,
            disableAutoFlatten=false,
            autoFlattenDelayMs=30,
            debug,
            debugMode,
        }=options;
        this.userRoles=userRoles;
        this.roleMap=roleMap;
        this.completionService=completionService;
        this.capabilities=capabilities;
        this.serviceCapabilities=serviceCapabilities;
        this.maxAutoCompleteDepth=maxAutoCompleteDepth;
        this._trackTime=new BehaviorSubject<boolean>(trackTime);
        this._trackTokens=new BehaviorSubject<boolean>(trackTokens);
        this._trackModel=new BehaviorSubject<boolean>(trackModel);
        this.disableAutoFlatten=disableAutoFlatten;
        this.autoFlattenDelayMs=autoFlattenDelayMs;
        this.debug=debug;
        if(debugMode){
            this.debugMode=true;
        }

        if(this.capabilities.includes('vision')){
            this.define({
                hidden:true,
                fn:createConvoVisionFunction({
                    conversationOptions:options,
                })
            },true)
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this.autoFlattenId++;
        this._isDisposed=true;
    }

    public autoUpdateCompletionService()
    {
        if(!this.completionService){
            this.completionService=convoCompletionService.get();
        }
    }

    public append(messages:string|(ConvoMessagePart|string)[],mergeWithPrev=false,throwOnError=true):ConvoParsingResult{
        let visibleContent:string|undefined=undefined;
        let hasHidden=false;
        if(Array.isArray(messages)){
            hasHidden=messages.some(m=>(typeof m === 'object')?m.hidden:false);
            if(hasHidden){
                visibleContent=messages.filter(m=>(typeof m === 'string')||!m.hidden).map(m=>(typeof m === 'string')?m:m.content).join('');
                messages=messages.map(m=>(typeof m === 'string')?m:m.content).join('');
            }else{
                messages=messages.map(m=>(typeof m === 'string')?m:m.content).join('');
            }
        }
        const r=parseConvoCode(messages);
        if(r.error){
            if(!throwOnError){
                return r;
            }
            throw r.error
        }

        if(hasHidden){
            messages=visibleContent??'';
        }

        if(messages){
            if(mergeWithPrev && this._convo.length){
                this._convo[this._convo.length-1]+='\n'+messages;
            }else{
                this._convo.push(messages);
            }
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

        if(!this.disableAutoFlatten){
            this.autoFlattenAsync();
        }

        return r;
    }

    private autoFlattenId=0;
    private async autoFlattenAsync(){
        const id=++this.autoFlattenId;
        if(this.autoFlattenDelayMs>0){
            await delayAsync(this.autoFlattenDelayMs);
            if(this.isDisposed || id!==this.autoFlattenId){
                return;
            }
        }

        const flat=await this.flattenAsync(undefined,false);
        if(this.isDisposed || id!==this.autoFlattenId){
            return;
        }
        this.setFlat(flat,false);
    }

    public appendUserMessage(message:string,options?:ConvoMessagePrefixOptions){
        this.append(formatConvoMessage('user',message,this.getPrefixTags(options)));
    }

    public appendAssistantMessage(message:string,options?:ConvoMessagePrefixOptions){
        this.append(formatConvoMessage('assistant',message,this.getPrefixTags(options)));
    }

    public appendMessage(role:string,message:string,options?:ConvoMessagePrefixOptions){
        this.append(formatConvoMessage(role,message,this.getPrefixTags(options)));
    }

    public appendDefine(defineCode:string,description?:string):ConvoParsingResult{
        return this.append((description?convoDescriptionToComment(description)+'\n':'')+'> define\n'+defineCode);
    }

    public appendTopLevel(defineCode:string,description?:string):ConvoParsingResult{
        return this.append((description?convoDescriptionToComment(description)+'\n':'')+'> do\n'+defineCode);
    }

    public getVar(nameOrPath:string,defaultValue?:any):any{
        return this._flat.value?.exe?.getVar(nameOrPath,null,defaultValue);
    }

    private getPrefixTags(options?:ConvoMessagePrefixOptions){
        let tags='';
        const msg=options?.msg;
        if(this.trackTime || this.getVar(convoVars.__trackTime)){
            tags+=`@${convoTags.time} ${getConvoDateString()}\n`;
        }
        if(!msg){
            return tags;
        }
        if(options?.includeTokenUsage && (this.trackTimeSubject || this.getVar(convoVars.__trackTokenUsage))){
            tags+=`@${convoTags.tokenUsage} ${convoUsageTokensToString(msg)}\n`;
        }
        if(msg.model && (this.trackModel || this.getVar(convoVars.__trackModel))){
            tags+=`@${convoTags.model} ${msg.model}\n`;
        }
        if(msg.format){
            tags+=`@${convoTags.format} ${msg.format}\n`
        }
        if(msg.assignTo){
            tags+=`@${convoTags.assign} ${msg.assignTo}\n`
        }
        return tags;
    }

    private setFlat(flat:FlatConvoConversation,dup=true){
        if(this.isDisposed){
            return;
        }
        this.autoFlattenId++;
        this._flat.next(dup?{...flat}:flat);
    }

    public async callFunctionAsync(fn:ConvoFunction|string,args:Record<string,any>={}):Promise<any>
    {
        const c=await this.tryCompleteAsync(flat=>{

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

        return await this.tryCompleteAsync(flat=>completionService?.completeConvoAsync(flat)??[])
    }

    private async tryCompleteAsync(
        getCompletion:ConvoFlatCompletionCallback,
        autoCompleteDepth=0,
        prevCompletion?:ConvoCompletionMessage[],
        preReturnValues?:any[]
    ):Promise<ConvoCompletion>{

        if(this._isCompleting.value){
            return {
                status:'busy',
                messages:[],
            }
        }else{
            this._isCompleting.next(true);
            try{
                return await this._completeAsync(getCompletion,autoCompleteDepth,prevCompletion,preReturnValues);
            }finally{
                this._isCompleting.next(false);
            }
        }
    }

    private readonly _isCompleting:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get isCompletingSubject():ReadonlySubject<boolean>{return this._isCompleting}
    public get isCompleting(){return this._isCompleting.value}

    private async _completeAsync(
        getCompletion:ConvoFlatCompletionCallback,
        autoCompleteDepth:number,
        prevCompletion?:ConvoCompletionMessage[],
        preReturnValues?:any[]
    ):Promise<ConvoCompletion>{

        this._activeTaskCount.next(this.activeTaskCount+1);

        try{
            let append:string[]|undefined=undefined;
            const flatExe=new ConvoExecutionContext({
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
            })
            flatExe.print=this.print;
            const flat=await this.flattenAsync(flatExe,false);
            const exe=flat.exe;
            if(this._isDisposed){
                return {messages:[],status:'disposed'}
            }

            for(const e in this.unregisteredVars){
                flat.exe.setVar(false,this.unregisteredVars[e],e);
            }

            this.setFlat(flat);

            const completion=await getCompletion(flat);
            if(this._isDisposed){
                return {messages:[],status:'disposed'};
            }

            let cMsg:ConvoCompletionMessage|undefined=undefined;

            let returnValues:any[]|undefined=undefined;

            let lastResultValue:any=undefined;

            for(const msg of completion){

                let includeTokenUsage=(msg.inputTokens || msg.outputTokens)?true:false;

                const tagsCode=msg.tags?convoTagMapToCode(msg.tags,'\n'):'';

                if(msg.format==='json' && msg.content){
                    let json=parseConvoJsonMessage(msg.content);
                    if(msg.formatIsArray && !Array.isArray(json) && Array.isArray(json.values)){
                        json=json.values;
                    }
                    msg.content=JSON.stringify(json,null,4)
                }

                if(msg.content){
                    cMsg=msg;
                    this.append(`${this.getPrefixTags({includeTokenUsage,msg})}${tagsCode}> ${this.getReversedMappedRole(msg.role)}\n${escapeConvoMessageContent(msg.content)}\n`);
                    includeTokenUsage=false;
                }

                if(msg.callFn){
                    const result=this.append(`${
                        this.getPrefixTags({includeTokenUsage,msg})
                    }${
                        tagsCode
                    }> call ${
                        msg.callFn
                    }(${
                        msg.callParams===undefined?'':spreadConvoArgs(msg.callParams,true)
                    })`);
                    includeTokenUsage=false;
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
                    if(this._isDisposed){
                        return {messages:[],status:'disposed'}
                    }
                    const callResultValue=callResult.valuePromise?(await callResult.valuePromise):callResult.value;
                    const target=this._messages.find(m=>m.fn && !m.fn.call && m.fn?.name===callMessage.fn?.name);
                    const disableAutoComplete=(
                        exe.getVarEx(convoDisableAutoCompleteName,undefined,callResult.scope,false)===true ||
                        containsConvoTag(target?.tags,convoTags.disableAutoComplete)
                    )
                    if(!returnValues){
                        returnValues=[];
                    }
                    returnValues.push(callResultValue);

                    lastResultValue=(typeof callResultValue === 'function')?undefined:callResultValue;

                    const lines:string[]=[`${this.getPrefixTags()}> result`];
                    if(exe.sharedSetters){
                        for(const s of exe.sharedSetters){
                            lines.push(`${s}=${JSON.stringify(exe.sharedVars[s],null,4)}`)
                        }
                    }
                    if( (typeof lastResultValue === 'string') &&
                        lastResultValue.length>50 &&
                        lastResultValue.includes('\n') &&
                        !lastResultValue.includes('---')
                    ){
                        lines.push(`${convoResultReturnName}=---\n${lastResultValue}\n---`)
                    }else{
                        lines.push(`${convoResultReturnName}=${JSON.stringify(lastResultValue,null,4)}`)
                    }
                    lines.push('');
                    this.append(lines.join('\n'),true);

                    if(disableAutoComplete){
                        lastResultValue=undefined;
                    }

                    this.setFlat(flat);

                }

                if(includeTokenUsage){
                    this.append(`${this.getPrefixTags({includeTokenUsage,msg})}> define\n// token usage placeholder`);
                    includeTokenUsage=false;
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
            }else if(lastResultValue!==undefined && autoCompleteDepth<this.maxAutoCompleteDepth){
                return await this._completeAsync(getCompletion,autoCompleteDepth+1,completion,returnValues);
            }

            if(!this.disableAutoFlatten){
                this.autoFlattenAsync();
            }

            return {
                status:'complete',
                message:cMsg,
                messages:completion,
                exe,
                returnValues,
            }
        }finally{
            this._activeTaskCount.next(this.activeTaskCount-1);
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
        exe?:ConvoExecutionContext,
        setCurrent=true
    ):Promise<FlatConvoConversation>{

        if(!exe){
            exe=new ConvoExecutionContext({conversation:this});
            exe.print=this.print;
        }

        const messages:FlatConvoMessage[]=[];
        const edgePairs:{
            flat:FlatConvoMessage;
            msg:ConvoMessage;
        }[]=[];

        exe.loadFunctions(this._messages,this.externFunctions);

        for(let i=0;i<this._messages.length;i++){
            const msg=this._messages[i];
            if(!msg){
                continue;
            }
            const flat:FlatConvoMessage={
                role:this.getMappedRole(msg.role),
                tags:msg.tags?convoTagsToMap(msg.tags):undefined,
            }
            if(msg.fn){
                if(msg.fn.local || msg.fn.call){
                    continue;
                }else if(msg.fn.topLevel){
                    exe.clearSharedSetters();
                    const r=exe.executeFunction(msg.fn);
                    if(r.valuePromise){
                        await r.valuePromise;
                    }
                    if(exe.sharedSetters.length){
                        const varSetter:FlatConvoMessage={
                            role:msg.role??'define',
                        };
                        varSetter.setVars={};
                        for(const v of exe.sharedSetters){
                            varSetter.setVars[v]=exe.getVar(v);
                        }
                        messages.push(varSetter)
                    }
                    const prev=this._messages[i-1];
                    if(msg.role==='result' && prev?.fn?.call){
                        flat.role='function';
                        flat.called=prev.fn;
                        flat.calledReturn=exe.getVarEx(convoResultReturnName,undefined,undefined,false);
                        flat.calledParams=exe.getConvoFunctionArgsValue(prev.fn);
                        if(prev.tags){
                            flat.tags=flat.tags?{...convoTagsToMap(prev.tags),...flat.tags}:convoTagsToMap(prev.tags)
                        }
                    }else{
                        continue;
                    }
                }else{
                    flat.role='function';
                    flat.fn=msg.fn;
                    flat.fnParams=exe.getConvoFunctionArgsScheme(msg.fn);
                }
            }else if(msg.statement){
                if(containsConvoTag(msg.tags,convoTags.edge)){
                    flat.edge=true;
                    edgePairs.push({flat,msg:msg});
                }else{
                    await flattenMsgAsync(exe,msg.statement,flat);
                }

            }else if(msg.content!==undefined){
                flat.content=msg.content;
            }else{
                continue;
            }

            if(!flat.edge){
                this.applyTags(msg,flat,exe);
            }
            messages.push(flat);
        }

        for(const pair of edgePairs){
            if(pair.msg.statement){
                await flattenMsgAsync(exe,pair.msg.statement,pair.flat);
            }
            this.applyTags(pair.msg,pair.flat,exe);
        }


        if(this.capabilities.includes('vision')){
            const systemMessage=messages.find(m=>m.role==='system');
            const content=exe.getVar(convoVars.__visionServiceSystemMessage,null,defaultConvoVisionSystemMessage);
            if(systemMessage){
                systemMessage.content=(
                    (systemMessage.content?systemMessage.content+'\n\n':'')+
                    content
                )
            }else{
                messages.unshift({
                    role:'system',
                    content
                })
            }
        }


        const shouldDebug=this.shouldDebug(exe);
        const debug=shouldDebug?(this.debug??this.debugToConversation):undefined;
        if(shouldDebug){
            exe.print=(...args:any[])=>{
                debug?.(...args);
                return defaultConvoPrintFunction(...args);
            }
        }

        const flat={
            exe,
            messages,
            conversation:this,
            debug,
            capabilities:[...this.serviceCapabilities],
        }

        if(setCurrent){
            this.setFlat(flat);
        }

        return flat;
    }

    private applyTags(msg:ConvoMessage,flat:FlatConvoMessage,exe:ConvoExecutionContext)
    {
        if(msg.assignTo){
            exe.setVar(true,msg.jsonValue??flat.content,msg.assignTo);
        }
        if(!msg.tags){
            return;
        }
        let responseFormat:string|undefined;
        for(const tag of msg.tags){
            if(tag.name===convoTags.responseFormat){
                responseFormat=tag.value;
            }else if(tag.name===convoTags.json){
                responseFormat=tag.value?'json '+tag.value:'json';
            }else if(tag.name===convoTags.responseAssign){
                flat.responseAssignTo=tag.value;
            }
        }
        if(responseFormat){
            this.applyResponseFormat(msg,flat,responseFormat,exe);
        }
    }
    private applyResponseFormat(msg:ConvoMessage,flat:FlatConvoMessage,format:string,exe:ConvoExecutionContext)
    {
        if(!flat.content){
            return;
        }

        const parts=format.trim().split(' ');
        flat.responseFormat=parts[0];

        let typeName=parts[1]??'';
        if(!typeName){
            return;
        }
        const isArray=typeName.endsWith('[]')
        if(isArray){
            typeName=typeName.substring(0,typeName.length-2);
        }

        flat.responseFormatTypeName=typeName;
        flat.responseFormatIsArray=isArray;

        if(flat.responseFormat!=='json'){
            return;
        }

        const type=exe.getVar(typeName);

        let scheme=convoTypeToJsonScheme(type);

        if(!scheme){
            throw new ConvoError('invalid-message-response-scheme',{message:msg},`${typeName} does not point to a convo type object `);
        }

        if(isArray){
            scheme={
                type:'object',
                required:['values'],
                properties:{
                    values:{
                        type:'array',
                        items:scheme
                    }
                }
            }
        }

        flat.content+=`\n\nReturn an object that conforms to the JSON Schema below.\n:${
            JSON.stringify(scheme)
        }`;



    }

    public shouldDebug(exe?:ConvoExecutionContext)
    {
        return (
            this.debugMode ||
            (exe?exe.getVar(convoVars.__debug):this.getVar(convoVars.__debug))
        )?true:false;
    }

    public readonly debugToConversation=(...args:any[])=>{
        if(!args.length){
                return;
            }
            const out:string[]=[];
            for(const v of args){
                if(typeof v === 'string'){
                    out.push(v);
                }else{
                    try{
                        out.push(JSON.stringify(v,null,4)??'');
                    }catch{
                        out.push(v?.toString()??'');
                    }
                }
            }
            const debugComment=convoStringToComment(out.join('\n'));
            this.append(`> debug\n${debugComment}`);
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


        const outParts:(string|ConvoMessagePart)[]=[];
        const push=(content:string,item:ConvoDefItem)=>{
            if(item.hidden){
                outParts.push({hidden:true,content});
            }else{
                outParts.push(content);
            }
        }
        for(let i=0;i<items.length;i++){
            const item=items[i];
            if(!item){
                continue;
            }
            const type=item.type;
            if(!type || (!override && this.getAssignment(type.name))){
                continue
            }

            validateConvoTypeName(type.name);

            const str=schemeToConvoTypeString(type.type,type.name);
            if(!str){
                continue;
            }
            push(str,item);
            push('\n',item);
            this.definitionItems.push({type});
        }

        for(let i=0;i<items.length;i++){
            const item=items[i];
            if(!item){
                continue;
            }
            const v=item.var;
            if(!v || (!override && this.getAssignment(v.name))){
                continue
            }

            validateConvoVarName(v.name);

            push(`${v.name} = ${JSON.stringify(v.value,null,4)}`,item);
            push('\n',item);
            this.definitionItems.push({var:v});
        }

        if(outParts.length){
            outParts.unshift('> define\n')
        }

        for(let i=0;i<items.length;i++){
            const item=items[i];
            if(!item){
                continue;
            }
            const fn=items[i]?.fn;
            if(!fn || (!override && this.getAssignment(fn.name))){
                continue
            }

            validateConvoFunctionName(fn.name);

            if(outParts.length){
                push('\n',item);
            }
            if(fn.registerOnly){
                if(fn.local===false){
                    throw new ConvoError('invalid-register-only-function',undefined,'Register only functions can only be local');
                }
                this.createFunctionImpl(fn);
            }else{
                push(this.createFunctionImpl(fn),item);
                push('\n',item);
            }
        }

        return outParts.length?this.append(outParts):undefined;
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
            let scopeFn:ConvoScopeFunction|undefined=undefined;
            if(fnDef.scopeCallback){
                scopeFn=fnDef.scopeCallback;
            }else if(fnDef.callback){
                const callback=fnDef.callback;
                if(fnDef.paramsJsonScheme || fnDef.paramsType){
                    scopeFn=(scope)=>{
                        return callback(convoLabeledScopeParamsToObj(scope));
                    }
                }else{
                    scopeFn=(scope)=>{
                        return callback(scope.paramValues?.[0]);
                    }
                }
            }
            if(scopeFn){
                this.externFunctions[fnDef.name]=scopeFn;
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


const flattenMsgAsync=async (exe:ConvoExecutionContext,statement:ConvoStatement,flat:FlatConvoMessage)=>{
    const r=exe.executeStatement(statement);
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
}
