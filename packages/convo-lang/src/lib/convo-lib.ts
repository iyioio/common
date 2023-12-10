import { ConvoError } from "./ConvoError";
import { ConvoBaseType, ConvoFlowController, ConvoMetadata, ConvoPrintFunction, ConvoScope, ConvoScopeError, ConvoScopeFunction, ConvoStatement, ConvoTag, ConvoType, OptionalConvoValue, convoFlowControllerKey, convoObjFlag } from "./convo-types";

export const convoBodyFnName='__body';
export const convoArgsName='__args';
export const convoResultReturnName='__return';
export const convoResultErrorName='__error';
export const convoDisableAutoCompleteName='__disableAutoComplete';
export const convoStructFnName='struct';
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
    disableAutoComplete:'disableAutoComplete',
    /**
     * Used to indicate that a message should be evaluated at the edge of a conversation with the
     * latest state.
     */
    edge:'edge',
} as const;

export const defaultConvoVisionSystemMessage=(
    'If the user asks a question about a markdown image without a '+
    'description or the description can not answer the user\'s question or '+
    `complete the user\`s request call the ${convoFunctions.queryImage} function.`
);

export const defaultConvoVisionResponse='Unable to answer or respond to questions or requests for the given image or images';

export const allowedConvoDefinitionFunctions=[
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

export const escapeConvoMessageContent=(content:string):string=>{
    // todo - add escape sequence for \n\s*>
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
