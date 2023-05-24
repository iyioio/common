import { ParseProtoExpressOptions, ProtoEvalContext, ProtoEvalValue, ProtoExpression, ProtoExpressionControlFlowFlag, ProtoExpressionControlFlowResult, ProtoExpressionCtrlType, builtInProtoExpressionCtrlTypes } from "./protogen-expression-types";
import { parseProtoPrimitiveUndefined } from "./protogen-lib";
import { ProtoNode } from "./protogen-types";

export const parseProtoExpression=({
    node,
    filterPaths
}:ParseProtoExpressOptions):ProtoExpression=>{
    return _parseProtoExpression(node,node.name,filterPaths,null);
}

const typeDefiners:ProtoExpressionCtrlType[]=['vars','props'];

const _parseProtoExpression=(node:ProtoNode,path:string,filterPaths:string[]|undefined,parent:ProtoExpression|null):ProtoExpression=>{

    const definesTypes=typeDefiners.includes(parent?.ctrl as any);

    const isDotPath=node.types?.[0]?.dot;
    const isRefType=!isDotPath && node.types?.[0]?.isRefType;
    const expression:ProtoExpression=(
        definesTypes?{
            name:path,
            type:node.type||'any',
            value:node.valueEq?parseProtoPrimitiveUndefined(node.value):undefined
        }
        :(!filterPaths || filterPaths.some(p=>path.startsWith(p)))?
            {
                name:node.name,
                path:isDotPath?node.value?.startsWith('.')?node.value.substring(1):node.value:undefined,
                address:isDotPath?undefined:node.links?.[0]?.address,
                value:(isRefType || isDotPath)?undefined:parseProtoPrimitiveUndefined(node.value),
                invert:node.types?.[0]?.ex===true?true:undefined,
                ctrl:builtInProtoExpressionCtrlTypes.includes(node.name as any)?node.name as any:undefined,
            }
        :
        {
            name:node.name,
        }
    )

    if(node.children){
        for(const n in node.children){
            const child=node.children[n];
            if(!child || child.isContent || child.special){
                continue;
            }
            const sub=_parseProtoExpression(child,path?path+'.'+n:n,filterPaths,expression)
            if(!expression.sub){
                expression.sub=[];
            }
            expression.sub.push(sub);
        }
    }

    return expression;
}



export const createProtoExpressionControlFlowResult=(
    result:Omit<ProtoExpressionControlFlowResult,'typeFlag'>
):ProtoExpressionControlFlowResult=>({
    typeFlag:ProtoExpressionControlFlowFlag,
    ...result
})


export const getDirectExpressionValue=(expression:ProtoExpression,context:ProtoEvalContext):ProtoEvalValue=>{
    let value:any;
    if(expression.path){
        value=context.vars[expression.path]
    }else{
        value=expression.value;
    }
    if(expression.invert){
        value=!value;
    }
    return value;
}

export class ProtoExpressionError extends Error
{

}

export class InvalidProtoExpressionSyntaxError extends ProtoExpressionError
{

}

export class MaxProtoExpressionEvalCountError extends ProtoExpressionError
{

}

export class ProtoExpressionPauseNotAllowedError extends ProtoExpressionError
{

}
export class UnableToFindProtoExpressionResumeId extends ProtoExpressionError
{

}

export const getCallableProtoExpressions=(expression:ProtoExpression, append:ProtoExpression[]=[]):ProtoExpression[]=>
{
    if(expression.address){
        append.push(expression);
    }

    if(expression.sub){
        for(const sub of expression.sub){
            getCallableProtoExpressions(sub,append);
        }
    }

    return append;
}
