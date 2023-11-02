import { ConvoBaseType, ConvoError, ConvoFlowController, ConvoScope, ConvoScopeFunction, ConvoTypeDef, OptionalConvoValue, convoFlowControllerKey, convoObjFlag } from "./convo-types";

export const convoBodyFnName='__body';
export const convoMapFnName='map';
export const convoArrayFnName='array';
export const convoJsonMapFnName='jsonMap';
export const convoJsonArrayFnName='jsonArray';
export const convoLocalFunctionModifier='local';
export const convoCallFunctionModifier='call';
export const convoEnumFnName='enum';
export const convoArgsName='__args';

export const allowedConvoDefinitionFunctions=[
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

export const setConvoScopeError=(scope:ConvoScope|null|undefined,error:ConvoError|string)=>{
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

export const convoLabeledScopeParamsToObj=(scope:ConvoScope):Record<string,any>=>{
    const obj:Record<string,any>={};
    const labels=scope.labels
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
            }
        }
    }
    return obj;
}

export const escapeConvoMessageContent=(content:string):string=>{
    // todo - add escape sequence for \n\s*>
    return content;
}

export const spreadConvoArgs=(args:Record<string,any>):string=>{
    const json=JSON.stringify(args);
    return json.substring(1,json.length-1);
}
