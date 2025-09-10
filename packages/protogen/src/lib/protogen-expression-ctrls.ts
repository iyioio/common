import { parseTimeInterval } from "@iyio/common";
import { InvalidProtoExpressionSyntaxError, createProtoExpressionControlFlowResult, getDirectExpressionValue } from "./protogen-expression-lib.js";
import { ProtoExpressionControlFlowResult, ProtoExpressionCtrl, ProtoExpressionCtrlType, isProtoExpressionControlFlowResult } from "./protogen-expression-types.js";

export const getProtoExpressionCtrl=(type:ProtoExpressionCtrlType|ProtoExpressionCtrl|null|undefined):ProtoExpressionCtrl|undefined=>{
    if(!type){
        return undefined;
    }

    switch(type){

        case 'and': return andCtrl;
        case 'or': return orCtrl;
        case 'return': return returnCtrl;
        case 'set': return setCtrl;
        case 'inc': return incCtrl;
        case 'dec': return decCtrl;
        case 'if': return ifCtrl;
        case 'loop': return loopCtrl;
        case 'throw': return throwCtrl;
        case 'in': return inCtrl;
        case 'add': return addCtrl;
        case 'sub': return subCtrl;
        case 'mul': return mulCtrl;
        case 'div': return divCtrl;
        case 'mod': return modCtrl;
        case 'not': return notCtrl;
        case 'eq': return eqCtrl;
        case 'neq': return neqCtrl;
        case 'lt': return ltCtrl;
        case 'mt': return mtCtrl;
        case 'lte': return lteCtrl;
        case 'mte': return mteCtrl;
        case 'bit-and': return bitAndCtrl;
        case 'bit-or': return bitOrCtrl;
        case 'bit-xor': return bitXorCtrl;
        case 'bit-not': return bitNotCtrl;
        case 'bit-shift-left': return bitShiftLeftCtrl;
        case 'bit-shift-right': return bitShiftRightCtrl;
        case 'bit-zero-right': return bitZeroRightCtrl;
        case 'pause': return pauseCtrl;
        case 'resume': return resumeCtrl;

        default:
            if(typeof type !== 'string'){
                return type;
            }
            return undefined;
    }
}

const andCtrl:ProtoExpressionCtrl={
    afterSub:(value)=>{
        return value?'continue':'break';
    }
}

const orCtrl:ProtoExpressionCtrl={
    afterSub:(value)=>{
        return value?'break':'continue';
    }
}

const returnCtrl:ProtoExpressionCtrl={
    result:(value):ProtoExpressionControlFlowResult=>{
        return isProtoExpressionControlFlowResult(value)?value:
            createProtoExpressionControlFlowResult({
            exit:true,
            complete:true,
            returnValue:value
        })
    }
}

const setCtrl:ProtoExpressionCtrl={
    ignorePath:true,
    ignoreValue:true,
    ignoreCall:true,
    result:(value,ctrlData,expression,context)=>{
        if(expression.path && !isProtoExpressionControlFlowResult(value)){
            context.vars[expression.path]=value;
        }
        return value
    }
}

const incCtrl:ProtoExpressionCtrl={
    ignorePath:true,
    ignoreValue:true,
    ignoreCall:true,
    result:(value,ctrlData,expression,context)=>{
        if(expression.path && !isProtoExpressionControlFlowResult(value)){
            return context.vars[expression.path]=((context.vars[expression.path]??0) as any)+((value===undefined?1:value) as any);
        }
        return value
    }
}

const decCtrl:ProtoExpressionCtrl={
    ignorePath:true,
    ignoreValue:true,
    ignoreCall:true,
    result:(value,ctrlData,expression,context)=>{
        if(expression.path && !isProtoExpressionControlFlowResult(value)){
            return context.vars[expression.path]=((context.vars[expression.path]??0) as any)-((value===undefined?1:value) as any);
        }
        return value
    }
}

const throwCtrl:ProtoExpressionCtrl={
    result:(value)=>{
        return createProtoExpressionControlFlowResult({
            exit:true,
            error:value
        })
    }
}

const inCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>{
        if(!Array.isArray(value)){
            return false;
        }
        return value.includes(prev);
    }
}
const addCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev+value
}
const subCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev-value
}
const mulCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev*value
}
const divCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev/value
}
const modCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev%value
}
const eqCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev==value
}
const neqCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev!=value
}
const ltCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev<value
}
const mtCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev>value
}
const lteCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev<=value
}
const mteCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev>=value
}
const bitAndCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev&value
}
const bitOrCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev|value
}
const bitXorCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev^value
}
const bitNotCtrl:ProtoExpressionCtrl={
    result:(value:any)=>isProtoExpressionControlFlowResult(value)?
        value:~value
}
const bitShiftLeftCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev<<value
}
const bitShiftRightCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev>>value
}
const bitZeroRightCtrl:ProtoExpressionCtrl={
    mergeSubValues:(prev:any,value:any)=>prev>>>value
}
const notCtrl:ProtoExpressionCtrl={
    result:(value)=>isProtoExpressionControlFlowResult(value)?
        value:!value
}


const ifCtrl:ProtoExpressionCtrl={
    ignorePath:true,
    ignoreValue:true,
    ignoreCall:true,
    ignoreInvert:true,
    beforeSub:(data,sub,exp,context)=>{
        if(!data['step'] && (exp.value!==undefined || exp.path)){
            data['step']=getDirectExpressionValue(exp,context)?'then':'else';
        }

        switch(data['step']){
            case undefined:
                if(sub.name!=='condition'){
                    throw new InvalidProtoExpressionSyntaxError(
                        'ProtoExpression syntax error. Fist sub of if statement must be an '+
                        'expression named condition')
                }
                data['step']='condition';
                return 'continue';

            case 'then':
                return sub.name==='then'?'continue':'skip';

            case 'else':
                return sub.name==='else'?'continue':'skip';

            default:
                return 'skip';
        }
    },
    afterSub:(value,data)=>{
        switch(data['step']){
            case 'condition':
                data['step']=value?'then':'else';
                break;
        }
        return 'continue';
    }
}


const loopCtrl:ProtoExpressionCtrl={
    ignorePath:true,
    ignoreValue:true,
    ignoreCall:true,
    ignoreInvert:true,
    loop(_continue, loopCount, ctrlData, exp, context) {

        if(!_continue){
            return false;
        }

        if(!ctrlData['i']){
            ctrlData['i']=0;
        }

        ctrlData['i']=(ctrlData['i'] as number)+1;

        const expValue=getDirectExpressionValue(exp,context);


        switch(typeof expValue){
            case 'number':
                return (ctrlData['i'] as number)<=expValue;

            default:
                return expValue===undefined?true:(expValue?true:false);
        }
    },
    afterSub(value,data,sub){
        if(isProtoExpressionControlFlowResult(value)){
            return 'continue';
        }
        if(sub.name==='break'){
            return (value===undefined || value)?'break':'continue';
        }
        if(sub.name==='continue'){
            return (value===undefined || value)?'reset':'continue';
        }

        if(sub.name==='condition'){
            return value?'continue':'break';
        }

        return 'continue';
    }
}

const pauseCtrl:ProtoExpressionCtrl={
    ignorePath:true,
    ignoreValue:true,
    ignoreCall:true,
    result:(value,data,exp)=>{
        if(isProtoExpressionControlFlowResult(value)){
            return value;
        }
        if(typeof exp.value !== 'string'){
            throw new InvalidProtoExpressionSyntaxError('pause statement requires a label be defined');
        }
        const type=typeof value;
        return createProtoExpressionControlFlowResult({
            exit:true,
            resumeId:exp.value,
            resumeAfter:(value==='' || value===undefined || (type!=='number' && type!=='string'))?
                undefined:parseTimeInterval(value as number|string),

        })
    },
    canResume:(id,exp)=>id===exp.value
}

const resumeCtrl:ProtoExpressionCtrl={
    ignorePath:true,
    ignoreValue:true,
    ignoreCall:true,
    result:(value,data,exp)=>{
        if(isProtoExpressionControlFlowResult(value)){
            return value;
        }
        if(typeof exp.value !== 'string'){
            throw new InvalidProtoExpressionSyntaxError('resume statement requires a label be defined');
        }
        return value;
    },
    canResume:(id,exp)=>id===exp.value
}
