import { format } from "date-fns";
import { parse as parseJson5 } from 'json5';
import { ConvoError } from "./ConvoError";
import { ConvoBaseType, ConvoFlowController, ConvoMessage, ConvoMessageTemplate, ConvoMetadata, ConvoPrintFunction, ConvoScope, ConvoScopeError, ConvoScopeFunction, ConvoStatement, ConvoTag, ConvoTokenUsage, ConvoType, OptionalConvoValue, convoFlowControllerKey, convoObjFlag, convoReservedRoles } from "./convo-types";

export const convoBodyFnName='__body';
export const convoArgsName='__args';
export const convoResultReturnName='__return';
export const convoResultErrorName='__error';
export const convoDisableAutoCompleteName='__disableAutoComplete';
export const convoStructFnName='struct';
export const convoNewFnName='new';
export const convoMapFnName='map';
export const convoArrayFnName='array';
export const convoJsonMapFnName='jsonMap';
export const convoJsonArrayFnName='jsonArray';
export const convoSwitchFnName='switch';
export const convoCaseFnName='case';
export const convoDefaultFnName='default';
export const convoTestFnName='test';
export const convoPipeFnName='pipe';
export const convoLocalFunctionModifier='local';
export const convoCallFunctionModifier='call';
export const convoGlobalRef='convo';
export const convoEnumFnName='enum';
export const convoMetadataKey=Symbol('convoMetadataKey');
export const convoCaptureMetadataTag='captureMetadata';

export const defaultConvoTask='default';

export const convoFunctions={
    queryImage:'queryImage'
} as const;

/**
 * reserved system variables
 */
export const convoVars={

    /**
     * In environments that have access to the filesystem __cwd defines the current working directory.
     */
    __cwd:'__cwd',

    /**
     * When set to true debugging information will be added to conversations.
     */
    __debug:'__debug',

    /**
     * Sets the default model
     */
    __model:'__model',

    /**
     * Sets the default completion endpoint
     */
    __endpoint:'__endpoint',

    /**
     * When set to true time tracking will be enabled.
     */
    __trackTime:'__trackTime',

    /**
     * When set to true token usage tracking will be enabled.
     */
    __trackTokenUsage:'__trackTokenUsage',

    /**
     * When set to true the model used as a completion provider will be tracked.
     */
    __trackModel:'__trackModel',

    /**
     * When defined __visionSystemMessage will be injected into the system message of conversations
     * with vision capabilities. __visionSystemMessage will override the default vision
     * system message.
     */
    __visionSystemMessage:'__visionSystemMessage',

    /**
     * The default system message used for completing vision requests. Vision requests are typically
     * completed in a separate conversation that supports vision messages. By default the system
     * message of the conversation that triggered the vision request will be used.
     */
    __visionServiceSystemMessage:'__visionServiceSystemMessage',

    /**
     * Response used with the system is not able to generate a vision response.
     */
    __defaultVisionResponse:'__defaultVisionResponse',
} as const;

export const convoTags={

    /**
     * When applied to a function the return value of the function will not be used to generate a
     * new assistant message.
     */
    disableAutoComplete:'disableAutoComplete',
    /**
     * Used to indicate that a message should be evaluated at the edge of a conversation with the
     * latest state. @edge is most commonly used with system message to ensure that all injected values
     * are updated with the latest state of the conversation.
     */
    edge:'edge',

    /**
     * Used to track the time messages are created.
     */
    time:'time',

    /**
     * Used to track the number of tokens a message used
     */
    tokenUsage:'tokenUsage',

    /**
     * Used to track the model used to generate completions
     */
    model:'model',

    /**
     * Sets the requested model to complete a message with
     */
    responseModel:'responseModel',

    /**
     * Used to track the endpoint to generate completions
     */
    endpoint:'endpoint',

    /**
     * Sets the requested endpoint to complete a message with
     */
    responseEndpoint:'responseEndpoint',

    /**
     * Sets the format as message should be responded to with.
     */
    responseFormat:'responseFormat',

    /**
     * Causes the response of the tagged message to be assigned to a variable
     */
    responseAssign:'responseAssign',

    /**
     * When used with a message the json tag is short and for `@responseFormat json`
     */
    json:'json',

    /**
     * The format of a message
     */
    format:'format',

    /**
     * Used to assign the content or jsonValue of a message to a variable
     */
    assign:'assign',

    /**
     * Used to enable capabilities. The capability tag can only be used on the first message of the
     * conversation if used on any other message it is ignored. Multiple capability tags can be
     * applied to a message and multiple capabilities can be specified by separating them with a
     * comma.
     */
    capability:'capability',

    /**
     * Shorthand for `@capability vision`
     */
    enableVision:'enableVision',

    /**
     * Sets the task a message is part of. By default messages are part of the "default" task
     */
    task:'task',

    /**
     * Sets the max number of non-system messages that should be included in a task completion
     */
    maxTaskMessageCount:'maxTaskMessageCount',

    /**
     * Defines what triggers a task
     */
    taskTrigger:'taskTrigger',

    /**
     * Defines a message as a template
     */
    template:'template',

    /**
     * used to track the name of templates used to generate messages
     */
    sourceTemplate:'sourceTemplate',

    /**
     * Used to mark a message as a component. The value of the tag is used as the component name.
     * If no value is provided then the component will be unnamed.
     */
    component:'component',

    /**
     * When applied to a message the message should be rendered but not sent to LLMs
     */
    renderOnly:'renderOnly',

} as const;

export const convoTaskTriggers={
    /**
     * Triggers a text message is received. Function calls will to trigger.
     */
    onResponse:'onResponse'
} as const;

export const convoDateFormat="yyyy-MM-dd'T'HH:mm:ssxxx";

export const getConvoDateString=(date:Date|number=new Date()):string=>{
    return format(date,convoDateFormat);
}

export const defaultConvoVisionSystemMessage=(
    'If the user references a markdown image without a '+
    'description or the description can not answer the user\'s question or '+
    `complete the user\`s request call the ${convoFunctions.queryImage} function. `+
    'Do not use the URL of the image to make any assumptions about the image.'
);

export const defaultConvoVisionResponse='Unable to answer or respond to questions or requests for the given image or images';

export const allowedConvoDefinitionFunctions=[
    convoNewFnName,
    convoStructFnName,
    convoMapFnName,
    convoArrayFnName,
    convoEnumFnName,
    convoJsonMapFnName,
    convoJsonArrayFnName,
] as const;

export const createOptionalConvoValue=(value:any):OptionalConvoValue=>{
    return {
        [convoObjFlag]:'optional',
        value,
    }
}

export const createConvoType=(typeDef:Omit<ConvoType,typeof convoObjFlag>):ConvoType=>{
    (typeDef as ConvoType)[convoObjFlag]='type';
    return typeDef as ConvoType;
}
export const createConvoBaseTypeDef=(type:ConvoBaseType):ConvoType=>{
    return {
        [convoObjFlag]:'type',
        type,
    }
}

export const makeAnyConvoType=<T>(type:ConvoBaseType,value:T):T=>{
    if(!value){
        return value;
    }
    (value as any)[convoObjFlag]='type';
    (value as any)['type']=type;
    return value;
}

interface CreateConvoScopeFunctionOverloads
{
    ():ConvoScopeFunction;
    (fn:ConvoScopeFunction):ConvoScopeFunction;
    (flowCtrl:ConvoFlowController,fn?:ConvoScopeFunction):ConvoScopeFunction;
}

export const createConvoScopeFunction:CreateConvoScopeFunctionOverloads=(
    fnOrCtrl?:ConvoFlowController|ConvoScopeFunction,
    fn?:ConvoScopeFunction
):ConvoScopeFunction=>{
    if(typeof fnOrCtrl === 'function'){
        return fnOrCtrl;
    }
    if(!fn){
        fn=(scope)=>scope.paramValues?scope.paramValues[scope.paramValues.length-1]:undefined;
    }
    if(fnOrCtrl){
        (fn as any)[convoFlowControllerKey]=fnOrCtrl;
    }
    return fn;
}

export const setConvoScopeError=(scope:ConvoScope|null|undefined,error:ConvoScopeError|string)=>{
    if(typeof error === 'string'){
        error={
            message:error,
            statement:scope?.s,
        }
    }
    if(!scope){
        throw error;
    }
    scope.error=error;
    if(scope.onError){
        const oe=scope.onError;
        delete scope.onError;
        delete scope.onComplete;
        for(let i=0;i<oe.length;i++){
            oe[i]?.(error);
        }
    }
}

const notWord=/\W/g;
const newline=/[\n\r]/g;

export const convoTagMapToCode=(tagsMap:Record<string,string|undefined>,append='',tab=''):string=>{
    const out:string[]=[];
    for(const e in tagsMap){
        const v=tagsMap[e];
        out.push(`${tab}@${e.replace(notWord,'_')}${v?' '+v.replace(newline,' '):''}`)
    }
    return out.join('\n')+append
}

export const containsConvoTag=(tags:ConvoTag[]|null|undefined,tagName:string):boolean=>{
    if(!tags){
        return false;
    }
    for(let i=0;i<tags.length;i++){
        if(tags[i]?.name===tagName){
            return true;
        }
    }
    return false;
}

export const getConvoTag=(tags:ConvoTag[]|null|undefined,tagName:string):ConvoTag|undefined=>{
    if(!tags){
        return undefined;
    }
    for(let i=0;i<tags.length;i++){
        const tag=tags[i];
        if(tag?.name===tagName){
            return tag;
        }
    }
    return undefined;
}

export const convoTagsToMap=(tags:ConvoTag[]):Record<string,string|undefined>=>{
    const map:Record<string,string|undefined>={};
    for(const t of tags){
        map[t.name]=t.value;
    }
    return map;
}

export const createConvoMetadataForStatement=(statement:ConvoStatement):ConvoMetadata=>{
    return {
        name:(
            (statement.set && !statement.setPath)?
                statement.set
            :statement.label?
                statement.label
            :
                undefined
        ),
        comment:statement.comment,
        tags:statement.tags,
    };
}

export const getConvoMetadata=(value:any):ConvoMetadata|undefined=>{
    return value?.[convoMetadataKey];
}

export const convoLabeledScopeParamsToObj=(scope:ConvoScope):Record<string,any>=>{
    const obj:Record<string,any>={};
    const labels=scope.labels;
    let metadata:ConvoMetadata|undefined=undefined;
    if(scope.cm || (scope.s.tags && containsConvoTag(scope.s.tags,convoCaptureMetadataTag))){
        metadata=createConvoMetadataForStatement(scope.s);
        metadata.properties={};
        (obj as any)[convoMetadataKey]=metadata;
    }
    if(labels){
        for(const e in labels){
            const label=labels[e];
            if(label===undefined){
                continue;
            }
            const isOptional=typeof label === 'object'
            const index=isOptional?label.value:label;
            if(index!==undefined){
                const v=scope.paramValues?.[index]
                obj[e]=isOptional?createOptionalConvoValue(v):v;

                if(metadata?.properties && scope.s.params){
                    const propStatement=scope.s.params[index];
                    if(propStatement){
                        metadata.properties[e]={
                            name:e,
                            comment:propStatement.comment,
                            tags:propStatement.tags
                        }
                    }
                }

            }
        }
    }
    return obj;
}

export const isReservedConvoRole=(role:string)=>{
    return convoReservedRoles.includes(role as any);
}

export const isValidConvoRole=(role:string)=>{
    return /^\w+$/.test(role);
}

export const isValidConvoIdentifier=(role:string)=>{
    return /^[a-z]\w*$/.test(role);
}

export const formatConvoMessage=(role:string,content:string,prefix=''):string=>{
    if(!isValidConvoRole(role)){
        throw new ConvoError('invalid-role',undefined,`(${role}) is not a valid role`);
    }
    if(isReservedConvoRole(role)){
        throw new ConvoError('use-of-reserved-role-not-allowed',undefined,`${role} is a reserved role`);
    }
    return `${prefix}> ${role}\n${escapeConvoMessageContent(content)}`;
}

export const escapeConvoMessageContent=(content:string,isStartOfMessage=true):string=>{
    // todo escape tags at end of message

    if(content.includes('{{')){
        content=content.replace(/\{\{/g,'\\{{');
    }
    if(content.includes('>')){
        content=content.replace(
            // the non start of message reg should be the same except no start of input char should be included
            isStartOfMessage?
                /((?:\n|\r|^)[ \t]*\\*)>/g:
                /((?:\n|\r)[ \t]*\\*)>/g,
            (_,space)=>`${space}\\>`);
    }
    return content;
}

export const spreadConvoArgs=(args:Record<string,any>,format?:boolean):string=>{
    const json=JSON.stringify(args,null,format?4:undefined);
    return json.substring(1,json.length-1);
}

export const defaultConvoPrintFunction:ConvoPrintFunction=(...args:any[]):any=>{
    console.log(...args);
    return args[args.length-1];
}

export const collapseConvoPipes=(statement:ConvoStatement):number=>{
    const params=statement.params;
    if(!params){
        return 0;
    }
    delete statement._hasPipes;
    let count=0;
    for(let i=0;i<params.length;i++){
        const s=params[i];
        if(!s?._pipe){
            continue;
        }
        count++;

        const dest=params[i-1];
        const src=params[i+1];

        if(i===0 || i===params.length-1 || !dest || !src){// discard - pipes need a target and source
            params.splice(i,1);
            i--;
            continue;
        }

        if(dest.fn===convoPipeFnName){
            if(!dest.params){
                dest.params=[];
            }
            dest.params.unshift(src);
            params.splice(i,2);
        }else{

            const pipeCall:ConvoStatement={
                s:dest.s,
                e:dest.e,
                fn:convoPipeFnName,
                params:[src,dest]
            }

            params.splice(i-1,3,pipeCall);
        }
        i--;

    }

    return count;
}

export const convoDescriptionToCommentOut=(description:string,tab='',out:string[])=>{
    const lines=description.split('\n');
    for(let i=0;i<lines.length;i++){
        const line=lines[i];
        out.push(`${tab}# ${line}`);
    }
}
export const convoDescriptionToComment=(description:string,tab=''):string=>{
    const out:string[]=[];
    convoDescriptionToCommentOut(description,tab,out);
    return out.join('\n');
}

export const convoStringToCommentOut=(str:string,tab='',out:string[])=>{
    const lines=str.split('\n');
    for(let i=0;i<lines.length;i++){
        const line=lines[i];
        out.push(`${tab}// ${line}`);
    }
}
export const convoStringToComment=(str:string,tab=''):string=>{
    const out:string[]=[];
    convoStringToCommentOut(str,tab,out);
    return out.join('\n');
}


const nameReg=/^[a-z_]\w{,254}$/
const typeNameReg=/^[A-Z]\w{,254}$/
export const isValidConvoVarName=(name:string):boolean=>{
    return nameReg.test(name);
}
export const isValidConvoFunctionName=(name:string):boolean=>{
    return nameReg.test(name);
}
export const isValidConvoTypeName=(typeName:string):boolean=>{
    return typeNameReg.test(typeName);
}
export const validateConvoVarName=(name:string):void=>{
    if(nameReg.test(name)){
        throw new ConvoError(
            'invalid-variable-name',
            undefined,
            `${name} is an invalid Convo variable name. Variable names must start with a lower case letter followed by 0 to 254 more word characters`
        );
    }
}
export const validateConvoFunctionName=(name:string):void=>{
    if(nameReg.test(name)){
        throw new ConvoError(
            'invalid-function-name',
            undefined,
            `${name} is an invalid Convo function name. Function names must start with a lower case letter followed by 0 to 254 more word characters`
        );
    }
}
export const validateConvoTypeName=(name:string):void=>{
    if(nameReg.test(name)){
        throw new ConvoError(
            'invalid-type-name',
            undefined,
            `${name} is an invalid Convo type name. Type names must start with an upper case letter followed by 0 to 254 more word characters`
        );
    }
}

export const convoUsageTokensToString=(usage:Partial<ConvoTokenUsage>):string=>{
    return `${usage.inputTokens??0} / ${usage.outputTokens??0}${usage.tokenPrice?' / $'+usage.tokenPrice:''}`;
}

export const parseConvoUsageTokens=(str:string):ConvoTokenUsage=>{
    const parts=str.split('/');
    return {
        inputTokens:Number(parts[0])||0,
        outputTokens:Number(parts[1])||0,
        tokenPrice:Number(parts[2]?.replace('$',''))||0,
    }
}


export const parseConvoJsonMessage=(json:string):any=>{
    return parseJson5(json
        .replace(/^\s*`+\s*\w*/,'')
        .replace(/`+\s*$/,'')
        .trim()
    );
}

const danglingReg=/[\r\n^](\s*>\s*user\s*)$/;

export const removeDanglingConvoUserMessage=(code:string):string=>{
    const dm=danglingReg.exec(code);
    if(!dm){
        return code;
    }
    return code.substring(0,code.length-(dm[1]??'').length).trim();
}

export const concatConvoCode=(a:string,b:string):string=>{
    const dm=danglingReg.exec(a);
    if(!dm){
        return a+b;
    }
    return a.substring(0,a.length-(dm[1]??'').length)+b;
}


export const concatConvoCodeAndAppendEmptyUserMessage=(a:string,b:string):string=>{
    const code=concatConvoCode(a,b);
    if(!danglingReg.test(code)){
        return code+'\n\n> user\n';
    }else{
        return code;
    }
}

export const isConvoMessageIncludedInTask=(msg:ConvoMessage,task:string):boolean=>{
    const msgTask=getConvoTag(msg.tags,convoTags.task)?.value??defaultConvoTask;
    return msgTask===task;

}

export const parseConvoMessageTemplate=(msg:ConvoMessage,template:string):ConvoMessageTemplate=>{
    const match=/^(\w+)\s*([\w.]+)?\s*(.*)/.exec(template);
    return match?{
        message:msg,
        name:match[1],
        watchPath:match[2],
        matchValue:match[3],
    }:{
        message:msg,
    }
}

export const getConvoStatementSource=(statement:ConvoStatement,code:string):string=>{
    return code.substring(statement.s,statement.e);
}

/**
 * If the value is empty, null or undefined true is returned, otherwise the Boolean
 * constructor is used to parse the value.
 */
export const parseConvoBooleanTag=(value:string|null|undefined)=>{
    if(!value){
        return true;
    }
    return Boolean(value);
}
