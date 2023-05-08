import { CancelToken, deleteUndefined } from "@iyio/common";
import { getProtoExpressionCtrl } from "./protogen-expression-ctrls";
import { MaxProtoExpressionEvalCountError, ProtoExpressionPauseNotAllowedError, UnableToFindProtoExpressionResumeId, createProtoExpressionControlFlowResult } from "./protogen-expression-lib";
import { ProtoEvalContext, ProtoEvalFrame, ProtoEvalResult, ProtoEvalState, ProtoEvalValue, ProtoExpression, ProtoExpressionCallable, ProtoExpressionControlFlowResult, ProtoExpressionEngineOptions, isProtoExpressionControlFlowResult } from "./protogen-expression-types";


export class ProtoExpressionEngine
{
    public readonly context:ProtoEvalContext;

    public readonly cancelToken:CancelToken;

    private readonly expression:ProtoExpression;
    private readonly callableExpressions:Record<string,ProtoExpression>;
    private readonly callables:Record<string,ProtoExpressionCallable>;

    public constructor({
        context,
        expression,
        callableExpressions={},
        callables={},
        cancel=new CancelToken()

    }:ProtoExpressionEngineOptions){
        this.context={
            vars:{},
            frames:[],
            evalCount:0,
            ...deleteUndefined({...context})
        }
        this.cancelToken=cancel;
        this.expression=expression;
        this.callableExpressions=callableExpressions;
        this.callables=callables;
    }

    private _started=false;
    public get started(){return this._started}

    public async evalAsync():Promise<ProtoEvalResult>
    {
        if(this._started){
            throw new Error('ProtoExpressionEngine already started');
        }
        this._started=true;
        this.context.startTime=Date.now();

        try{
            if(this.context.lastResumeId){
                this.context.frames=getProtoExpressionResumeFrames(this.context.lastResumeId,this.expression);
            }
            delete this.context.lastResumeId;
            delete this.context.resumeAfter;
            const result=await this.evalExpression(this.expression,this.context,0);
            if(isProtoExpressionControlFlowResult(result)){
                const state:ProtoEvalState=(
                    result.complete?
                        'complete'
                    :result.canceled?
                        'canceled'
                    :result.error?
                        'failed'
                    :result.resumeId?
                        'paused'
                    :
                        'complete'
                )
                if(state==='paused'){
                    this.context.lastResumeId=result.resumeId;
                    this.context.resumeAfter=result.resumeAfter;
                }
                return {
                    state,
                    context:this.context,
                    value:state==='complete'?result.returnValue:undefined,
                    error:result.error,
                    errorMessage:result.errorMessage
                }
            }else{
                return {
                    state:'complete',
                    context:this.context,
                    value:result
                }
            }
        }catch(ex){
            return {
                state:'failed',
                context:this.context,
                error:ex,
                errorMessage:typeof (ex as any)?.message === 'string'?
                    (ex as any)?.message:'Expression failed'
            }
        }
    }

    private readonly evalExpression=async (expression:ProtoExpression,context:ProtoEvalContext,depth:number):Promise<ProtoEvalValue|ProtoExpressionControlFlowResult>=>
    {

        if(this.cancelToken.isCanceled){
            return createProtoExpressionControlFlowResult({
                canceled:true
            });
        }

        context.evalCount++;
        if(context.maxEvalCount!==undefined && context.evalCount>context.maxEvalCount){
            throw new MaxProtoExpressionEvalCountError(
                `Max number of expressions evaluated. max:${context.maxEvalCount}`);
        }

        let frame=context.frames[depth];
        if(!frame){
            frame={}
            context.frames.push(frame);
        }

        const ctrl=getProtoExpressionCtrl(expression.ctrl);

        let result:ProtoEvalValue|ProtoExpressionControlFlowResult=undefined;

        const calls=(!ctrl?.ignoreCall && expression.address)?true:false;

        let value:ProtoEvalValue|ProtoExpressionControlFlowResult=undefined;

        if(!ctrl?.skipSubs && expression.sub){
            if(frame.sub===undefined){
                frame.sub=0;
            }

            if(ctrl?.loop && !frame.ctrlData){
                frame.ctrlData={}
            }

            let _continue=true;
            let loopCount=-1;
            while(ctrl?.loop?
                ctrl.loop(_continue,++loopCount,frame.ctrlData as any,expression,context):
                (++loopCount)===0
            ){
                _continue=true;
                if(loopCount>0){
                    frame.sub=0;
                    context.evalCount++;
                    if(context.maxEvalCount!==undefined && context.evalCount>context.maxEvalCount){
                        throw new MaxProtoExpressionEvalCountError(
                            `Max number of expressions evaluated. max:${context.maxEvalCount}`);
                    }
                }

                for(;frame.sub<expression.sub.length;frame.sub++){
                    const sub=expression.sub[frame.sub];
                    if(!sub){
                        continue;
                    }
                    if(ctrl?.beforeSub){
                        if(!frame.ctrlData){
                            frame.ctrlData={}
                        }
                        const op=ctrl.beforeSub(frame.ctrlData,sub,expression,context);
                        if(op==='skip'){
                            continue;
                        }else if(op==='break'){
                            _continue=false;
                            break;
                        }else if(op==='reset'){
                            _continue=true;
                            break;
                        }
                    }
                    const prevSubValue=value;
                    value=await this.evalExpression(sub,context,depth+1);
                    if( ctrl?.mergeSubValues &&
                        frame.sub &&
                        !isProtoExpressionControlFlowResult(value) &&
                        !isProtoExpressionControlFlowResult(prevSubValue))
                    {
                        if(!frame.ctrlData){
                            frame.ctrlData={}
                        }
                        value=ctrl.mergeSubValues(prevSubValue,value,frame.ctrlData,sub,expression,context);
                    }
                    if(isProtoExpressionControlFlowResult(value)){
                        if(value.exit){
                            return value;
                        }
                    }else if(calls){
                        if(!frame.subResults){
                            frame.subResults={}
                        }
                        frame.subResults[sub.name??'']=value;
                    }
                    if(ctrl?.afterSub){
                        if(!frame.ctrlData){
                            frame.ctrlData={}
                        }
                        const op=ctrl.afterSub(value,frame.ctrlData,sub,expression,context);
                        if(op==='break'){
                            _continue=false;
                            break;
                        }else if(op==='reset'){
                            _continue=true;
                            break;
                        }

                    }
                }
            }
        }

        if(calls){
            if(expression.address){
                const callable=this.callables[expression.address];
                if(callable!==undefined){
                    if(!frame.subResults){
                        frame.subResults={}
                    }
                    result=await callable(expression.address,frame.subResults)
                }else{
                    const exCallable=this.callableExpressions[expression.address];
                    if(exCallable){
                        result=await this.evalExpression(exCallable,context,depth+1);
                        if(isProtoExpressionControlFlowResult(result) && result.resumeId){
                            throw new ProtoExpressionPauseNotAllowedError('Callable expressions are not allowed to pause evaluation');
                        }
                    }else{
                        const varValue=context.vars[expression.address];
                        if(varValue!==undefined){
                            result=varValue;
                        }
                    }
                }
            }
        }else if(expression.path){
            if(!ctrl?.ignorePath){
                result=context.vars[expression.path];
            }else{
                result=value;
            }
        }else if(expression.value!==undefined){
            if(!ctrl?.ignoreValue){
                result=expression.value;
            }else{
                result=value;
            }
        }else{
            result=value;
        }

        if(ctrl?.result){
            if(!frame.ctrlData){
                frame.ctrlData={}
            }
            result=await ctrl.result(result,frame.ctrlData,expression,context);
        }

        if(context.frames.length-1===depth){
            context.frames.pop();
        }

        if(!isProtoExpressionControlFlowResult(result)){
            if(expression.invert && !ctrl?.ignoreInvert){
                result=!result;
            }
            if(expression.type && expression.name){
                context.vars[expression.name]=result;
            }
        }

        return result;
    }
}

export const getProtoExpressionResumeFrames=(id:string,expression:ProtoExpression):ProtoEvalFrame[]=>{
    const frames:ProtoEvalFrame[]=[];
    if(!_getProtoExpressionResumeFrames(id,expression,frames)){
        throw new UnableToFindProtoExpressionResumeId(`resumeId:${id}`)
    }
    return frames;
}

const _getProtoExpressionResumeFrames=(id:string,expression:ProtoExpression,frames:ProtoEvalFrame[],parentFrame?:ProtoEvalFrame)=>{
    const frame:ProtoEvalFrame={}
    frames.push(frame);

    const ctrl=getProtoExpressionCtrl(expression.ctrl);
    if(ctrl?.canResume?.(id,expression)){
        if(parentFrame?.sub!==undefined){
            parentFrame.sub++;
        }
        frames.pop();
        return true;
    }

    if(!ctrl?.skipSubs && expression.sub){
        if(frame.sub===undefined){
            frame.sub=0;
        }
        for(;frame.sub<expression.sub.length;frame.sub++){
            const sub=expression.sub[frame.sub];
            if(!sub){
                continue;
            }
            const found=_getProtoExpressionResumeFrames(id,sub,frames,frame);
            if(found){
                return true;
            }
        }
    }

    frames.pop();
    return false;
}
