import { ConvoBaseType, ConvoFlowController, ConvoMetadata, ConvoPrintFunction, ConvoScope, ConvoScopeError, ConvoScopeFunction, ConvoStatement, ConvoTag, ConvoTypeDef, OptionalConvoValue, convoFlowControllerKey, convoObjFlag } from "./convo-types";

export const convoBodyFnName='__body';
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
export const convoArgsName='__args';
export const convoMetadataKey=Symbol('convoMetadataKey');
export const convoCaptureMetadataTag='captureMetadata';

export const allowedConvoDefinitionFunctions=[
    convoStructFnName,
    convoMapFnName,
    convoArrayFnName,
    convoEnumFnName
] as const;

export const createOptionalConvoValue=(value:any):OptionalConvoValue=>{
    return {
        [convoObjFlag]:'optional',
        value,
    }
}

export const createConvoTypeDef=(typeDef:Omit<ConvoTypeDef,typeof convoObjFlag>):ConvoTypeDef=>{
    (typeDef as ConvoTypeDef)[convoObjFlag]='type';
    return typeDef as ConvoTypeDef;
}
export const createConvoBaseTypeDef=(type:ConvoBaseType):ConvoTypeDef=>{
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
