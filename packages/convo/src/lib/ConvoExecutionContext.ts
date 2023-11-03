import { getValueByAryPath, isPromise } from '@iyio/common';
import { ZodObject, ZodType } from 'zod';
import { ConvoError } from './ConvoError';
import { defaultConvoVars } from "./convo-default-vars";
import { convoArgsName, convoBodyFnName, convoLabeledScopeParamsToObj, convoMapFnName, createConvoScopeFunction, createOptionalConvoValue, defaultConvoPrintFunction, setConvoScopeError } from './convo-lib';
import { ConvoExecuteResult, ConvoFlowController, ConvoFlowControllerDataRef, ConvoFunction, ConvoMessage, ConvoPrintFunction, ConvoScope, ConvoScopeFunction, ConvoStatement, convoFlowControllerKey, convoScopeFnKey } from "./convo-types";
import { convoValueToZodType } from './convo-zod';


const argsCacheKey=Symbol('argsCacheKey');
const returnCacheKey=Symbol('returnCacheKey');


export const executeConvoFunction=(fn:ConvoFunction,args:Record<string,any>={}):Promise<any>|any=>{
    const exe=new ConvoExecutionContext();
    const r=exe.executeFunction(fn,args);
    return r.valuePromise??r.value;
}

const createDefaultScope=(vars:Record<string,any>):ConvoScope=>{
    return {
        _d:true,
        vars,
        i:0,
        s:{s:0,e:0},
    }
}

const copyDefaultScope=(scope:ConvoScope):ConvoScope=>{
    if(scope._d){
        scope={...scope};
        delete scope._d;
    }

    return scope;
}

export class ConvoExecutionContext
{
    public readonly sharedVars:Record<string,any>;private nextSuspendId=1;

    private readonly suspendedScopes:Record<string,ConvoScope>={};

    public readonly sharedSetters:string[]=[];

    public print:ConvoPrintFunction=defaultConvoPrintFunction;

    public constructor()
    {
        this.sharedVars={...defaultConvoVars}
    }

    public loadFunctions(messages:ConvoMessage[],externFunctions?:Record<string,ConvoScopeFunction>)
    {
        for(const msg of messages){
            if(msg.fn && !msg.fn.call && !msg.fn.topLevel){
                this.setVar(true,createConvoScopeFunction({
                    usesLabels:true,
                    catchReturn:true,
                    sourceFn:msg.fn
                },(scope,ctx)=>{
                    if(msg.fn?.body){
                        const r=this.executeFunction(msg.fn,convoLabeledScopeParamsToObj(scope));
                        return r.valuePromise??r.value;
                    }else{
                        const externFn=externFunctions?.[msg.fn?.name??''];
                        if(!externFn){
                            setConvoScopeError(scope,`No extern function provided for ${msg.fn?.name}`);
                            return;
                        }
                        return externFn(scope,ctx);
                    }
                }),msg.fn.name);
            }
        }
    }

    public clearSharedSetters(){
        this.sharedSetters.splice(0,this.sharedSetters.length);
    }

    public executeStatement(statement:ConvoStatement):ConvoExecuteResult
    {

        const vars:Record<string,any>={}
        const scope:ConvoScope={
            i:0,
            vars,
            s:statement,
        }

        return this.execute(scope,vars);
    }

    public executeFunction(fn:ConvoFunction,args:Record<string,any>={}):ConvoExecuteResult
    {
        if(fn.call){
            throw new ConvoError(
                'proxy-call-not-supported',
                {fn},
                'executeFunction does not support proxy calls. Use executeFunctionAsync instead'
            )
        }

        const scheme=this.getConvoFunctionArgsScheme(fn);
        const parsed=scheme.safeParse(args);
        if(parsed.success===false){
            throw new ConvoError(
                'invalid-args',
                {fn},
                `Invalid args passed to convo function. fn = ${fn.name}, message = ${parsed.error.message}`
            );
        }

        args=parsed.data;

        const vars:Record<string,any>={
            [convoArgsName]:args
        }

        const scope:ConvoScope={
            i:0,
            vars,
            s:{
                fn:convoBodyFnName,
                params:fn.body??[],
                s:0,
                e:0,
            },
        }

        for(const e in args){
            this.setVar(false,args[e],e,undefined,scope);
        }


        return this.execute(scope,vars,this.getConvoFunctionReturnScheme(fn));
    }

    public async executeFunctionAsync(fn:ConvoFunction,args:Record<string,any>={}):Promise<any>
    {

        if(fn.call){
            const callee=(this.sharedVars[fn.name]?.[convoFlowControllerKey] as ConvoFlowController|undefined)?.sourceFn;
            if(!callee){
                throw new ConvoError(
                    'function-not-defined',
                    {fn},
                    `No function defined by the name ${fn.name}`);
            }
            args=await this.paramsToObjAsync(fn.params);
            console.log('hio 👋 👋 👋 CALL ARGS ---',args,JSON.stringify(fn.params,null,4));
            fn=callee;

        }

        const result=this.executeFunction(fn,args);

        if(result.valuePromise){
            return await result.valuePromise
        }else{
            return result.value;
        }
    }

    public getConvoFunctionArgsScheme(fn:ConvoFunction,cache=true):ZodObject<any>{
        if(cache){
            const s=(fn as any)[argsCacheKey];
            if(s){
                return s;
            }
        }
        let scheme:ZodObject<any>;
        if(fn.paramType){
            const type=this.getVarAsType(fn.paramType);
            if(!type){
                throw new ConvoError('function-args-type-not-defined',{fn});
            }
            if(!(type instanceof ZodObject)){
                throw new ConvoError('function-args-type-not-an-object',{fn})
            }
            scheme=type;
        }else{
            scheme=this.paramsToScheme(fn.params??[]);
        }
        if(cache){
            (fn as any)[argsCacheKey]=scheme;
        }
        return scheme;
    }

    public getConvoFunctionReturnScheme(fn:ConvoFunction,cache=true):ZodType<any>|undefined{
        if(!fn.returnType){
            return undefined;
        }
        if(cache){
            const s=(fn as any)[returnCacheKey];
            if(s){
                return s;
            }
        }

        const typeVar=this.sharedVars[fn.returnType];
        if(!typeVar){
            throw new ConvoError(
                'function-return-type-not-defined',
                {fn},
                `Function return type not defined. function = ${fn.name}, returnType = ${fn.returnType}`
            );
        }
        const scheme=convoValueToZodType(typeVar);
        if(cache){
            (fn as any)[returnCacheKey]=scheme;
        }
        return scheme;
    }

    public getVarAsType(name:string):ZodType<any>|undefined
    {
        const typeVar=this.sharedVars[name];
        if(!typeVar){
            return undefined;
        }
        return convoValueToZodType(typeVar);
    }

    public async paramsToObjAsync(params:ConvoStatement[]):Promise<Record<string,any>>{

        const vars:Record<string,any>={}
        const scope=this.executeScope({
            i:0,
            vars,
            s:{
                fn:convoMapFnName,
                params,
                s:0,
                e:0,
            }
        },undefined,createDefaultScope(vars));

        const r=this.execute(scope,vars);
        if(r.valuePromise){
            return await r.valuePromise;
        }else{
            return r.value;
        }
    }

    public paramsToScheme(params:ConvoStatement[]):ZodObject<any>{

        const vars:Record<string,any>={}
        const scope=this.executeScope({
            i:0,
            vars,
            s:{
                fn:convoMapFnName,
                params,
                s:0,
                e:0,
            }
        },undefined,createDefaultScope(vars));

        if(scope.si){
            throw new ConvoError(
                'suspended-scheme-statements-not-supported',
                {statements:params},
                'scheme statements should not be suspended'
            );
        }

        console.log('hio 👋 👋 👋 SCOPE EXECUTED',JSON.stringify(scope,null,4));

        const zType=convoValueToZodType(scope.v);

        if(!(zType instanceof ZodObject)){
            throw new ConvoError(
                'zod-object-expected',
                {statements:params},
                'ZodObject expected when converting ConvoStatements to zod type'
            );
        }

        return zType;
    }

    private execute(scope:ConvoScope,vars:Record<string,any>,resultScheme?:ZodType<any>):ConvoExecuteResult
    {

        scope=this.executeScope(scope,undefined,createDefaultScope(vars));

        if(scope.si){
            return {valuePromise:new Promise((r,j)=>{
                if(!scope.onComplete){
                    scope.onComplete=[];
                }
                if(!scope.onError){
                    scope.onError=[];
                }
                scope.onError.push(j);
                if(resultScheme){
                    scope.onComplete.push(value=>{
                        const parsed=resultScheme.safeParse(value);
                        if(parsed.success===true){
                            r(parsed.data);
                        }else if(parsed.success===false){
                            j(new ConvoError(
                                'invalid-return-value-type',
                                {statement:scope.s},
                                `Invalid result value - ${parsed.error.message}`
                            ));
                        }else{
                            r(value);
                        }
                    })
                }else{
                    scope.onComplete.push(r);
                }
            })}
        }else{
            if(scope.error){
                throw scope.error;
            }else{
                if(resultScheme){
                    const parsed=resultScheme.safeParse(scope.v);
                    if(parsed.success===true){
                        return {value:parsed.data}
                    }else if(parsed.success===false){
                        throw new ConvoError(
                            'invalid-return-value-type',
                            {statement:scope.s},
                            `Invalid result value - ${parsed.error.message}`
                        );
                    }
                }
                return {value:scope.v};
            }
        }
    }

    private executeScope(scope:ConvoScope,parent:ConvoScope|undefined,defaultScope:ConvoScope,resumeParamScope?:ConvoScope):ConvoScope{

        const statement=scope.s;

        let value:any=undefined;

        if(statement.fn){
            scope=copyDefaultScope(scope);
            const fn=scope[convoScopeFnKey]??(scope[convoScopeFnKey]=statement.fnPath?
                getValueByAryPath(this.sharedVars,statement.fnPath)?.[statement.fn]:
                this.sharedVars[statement.fn]
            );
            if(typeof fn !== 'function'){
                const errPath=statement.fnPath?statement.fnPath.join('.')+'.'+statement.fn:statement.fn;
                setConvoScopeError(scope,`${errPath} is not a function`);
                value=undefined;
                return scope;
            }

            if(!scope.paramValues){
                scope.paramValues=[];
            }
            const flowCtrl=fn[convoFlowControllerKey] as ConvoFlowController|undefined;
            const parentStartIndex=parent?.i??0;
            if(flowCtrl?.keepData && parent?.childCtrlData){
                const dr:ConvoFlowControllerDataRef|undefined=parent.childCtrlData[parentStartIndex.toString()];
                if(dr){
                    console.log('hio 👋 👋 👋 Set ctrlData',statement.fn,dr.ctrlData,dr);
                    scope.ctrlData=dr.ctrlData;
                    scope.childCtrlData=dr.childCtrlData;
                }
            }
            const shouldExecute=flowCtrl?.shouldExecute?.(scope,parent,this)??true;
            if(shouldExecute){
                delete scope.li;
                if(statement.params?.length){
                    if(flowCtrl?.usesLabels && !scope.labels){
                        scope.labels={}
                    }
                    if(flowCtrl?.startParam){
                        const startI=flowCtrl.startParam(scope,parent,this);
                        if(startI===false){
                            scope.i=statement.params.length;
                        }else{
                            scope.i=Math.max(0,startI);
                        }
                    }
                    while(scope.i<statement.params.length){
                        const paramStatement=statement.params[scope.i];

                        if(paramStatement){

                            let paramScope:ConvoScope;
                            if(resumeParamScope){
                                paramScope=resumeParamScope;
                                resumeParamScope=undefined;
                            }else{
                                const d=defaultScope;
                                d.s=paramStatement;
                                paramScope=this.executeScope(d,scope,defaultScope);
                            }

                            if(paramScope.error){
                                setConvoScopeError(scope,paramScope.error);
                                return scope;
                            }

                            if(paramScope.si){
                                this.suspendScope(scope,paramScope);
                                paramScope.pi=scope.si;
                                return scope;
                            }

                            if(flowCtrl?.discardParams){
                                scope.paramValues[0]=paramScope.v;
                            }else{
                                scope.paramValues.push(paramScope.v);
                            }

                            if(paramScope.r){
                                scope.v=paramScope.v;
                                if(!flowCtrl?.catchReturn){
                                    scope.r=true;
                                }
                                return scope;
                            }

                            if(paramScope.bl){
                                if(scope.li===scope.i){
                                    delete scope.fromIndex;
                                    delete scope.gotoIndex;
                                    delete scope.li;
                                }else{
                                    scope.bl=true;
                                    return scope;
                                }
                            }


                            if(scope.fromIndex===scope.i && scope.gotoIndex!==undefined){
                                scope.i=scope.gotoIndex;
                                delete scope.fromIndex;
                                delete scope.gotoIndex;
                            }else if(flowCtrl?.nextParam){
                                const f=flowCtrl.nextParam(scope,parent,paramStatement,this);
                                if(f===false){
                                    break;
                                }
                                scope.i=f;
                            }else{
                                scope.i++;
                            }

                        }else{
                            setConvoScopeError(scope,'Parameter expected');
                            return scope
                        }
                    }
                }
                console.log('hio 👋 👋 👋 CALL()',statement.fn,statement);
                value=fn(scope,this);
            }
            if(flowCtrl){
                if(flowCtrl.keepData && parent){
                    if(!parent.childCtrlData){
                        parent.childCtrlData={}
                    }
                    const dr:ConvoFlowControllerDataRef={
                        ctrlData:scope.ctrlData,
                        childCtrlData:scope.childCtrlData,
                    }
                    parent.childCtrlData[parentStartIndex.toString()]=dr;
                }
                if(flowCtrl.transformResult){
                    value=flowCtrl.transformResult(value,scope,parent,this);
                }
            }

        }else if(statement.ref){
            value=this.getVar(statement.ref,statement.refPath,scope);
        }else{
            value=statement.value;
        }

        if(scope.error){
            return scope;
        }

        if(isPromise(value)){
            scope=copyDefaultScope(scope);
            this.suspendScope(scope);
            value.then(v=>{
                scope.v=v;
                this.completeScope(scope,parent,defaultScope);
            }).catch(e=>{
                setConvoScopeError(scope,{
                    message:`Promise throw error - ${e?.message}`,
                    error:e,
                    statement,
                });
                this.completeScope(scope,parent,defaultScope);
            })
        }else{
            scope.v=value;
            this.completeScope(scope,parent,defaultScope);
        }

        return scope;
    }


    private suspendScope(scope:ConvoScope,waitFor?:ConvoScope){
        if(scope.si){
            console.error('Scope already suspended',scope);
            throw new ConvoError('scope-already-suspended',{statement:scope.s})
        }
        scope.si=(this.nextSuspendId++).toString();
        if(waitFor){
            scope.wi=waitFor.si;
        }
        this.suspendedScopes[scope.si]=scope;
    }

    private completeScope(scope:ConvoScope,parent:ConvoScope|undefined,defaultScope:ConvoScope){

        if(scope.wi){
            throw new ConvoError('scope-waiting',{statement:scope.s},`scope waiting on scope(${scope.wi}) before resuming`);
        }

        const statement=scope.s;
        if(statement.set){
            this.setVar(statement.shared,scope.v,statement.set,statement.setPath,scope);
        }

        if(statement.label && parent?.labels){
            parent.labels[statement.label]=statement.opt?createOptionalConvoValue(parent.i):parent.i;
        }

        delete scope.pi;

        if(scope.si){
            const si=scope.si;
            delete scope.si;
            delete this.suspendedScopes[si];
            const resume:ConvoScope[]=[];
            for(const e in this.suspendedScopes){
                const ss=this.suspendedScopes[e];
                if(ss?.wi===si){
                    delete this.suspendedScopes[e];
                    delete ss.si;
                    delete ss.wi;
                    resume.push(ss);
                }
            }
            for(const r of resume){
                const parent=r.pi?this.suspendedScopes[r.pi]:undefined;
                if(r.pi && !parent){
                    throw new ConvoError('suspension-parent-not-found',{statement:scope.s});
                }
                delete r.pi;
                this.executeScope(r,parent,defaultScope,scope);
            }
        }

        if(scope.onComplete){
            const oc=scope.onComplete;
            delete scope.onComplete;
            delete scope.onError;
            for(let i=0;i<oc.length;i++){
                oc[i]?.(scope.v);
            }
        }
    }

    public getRefValue(statement:ConvoStatement|null|undefined,scope?:ConvoScope,throwUndefined=true):any{
        if(!statement){
            return undefined;
        }
        if(!statement.ref){
            throw new ConvoError('variable-ref-required',{statement});
        }
        return this.getVar(statement.ref,statement.refPath,scope,throwUndefined);
    }

    public getVar(name:string,path?:string[],scope?:ConvoScope,throwUndefined=true){
        let value=scope?.vars[name]??this.sharedVars[name];
        if(value===undefined && !(name in this.sharedVars)){
            if(throwUndefined){
                setConvoScopeError(scope,`reference to undefined var - ${name}`);
            }
        }else if(path){
            value=getValueByAryPath(value,path);
        }
        return value;
    }

    public setRefValue(statement:ConvoStatement|null|undefined,value:any,scope?:ConvoScope):any{
        if(!statement){
            return value;
        }

        if(!statement.ref){
            throw new ConvoError('variable-ref-required',{statement});
        }

        this.setVar(statement.shared,value,statement.ref,statement.refPath,scope);

        return value;
    }

    public setVar(shared:boolean|undefined,value:any,name:string,path?:string[],scope?:ConvoScope){

        if(name in defaultConvoVars){
            setConvoScopeError(scope,'Overriding builtin var not allowed');
            return value;
        }

        const vars=(shared || !scope)?this.sharedVars:scope.vars;

        if(vars===this.sharedVars && (typeof value !== 'function') && !this.sharedSetters.includes(name)){
            this.sharedSetters.push(name);
        }

        if(path){
            let obj=vars[name];
            if(obj===undefined || obj===null){
                setConvoScopeError(scope,`reference to undefined var for setting path - ${name}`);
                return value;
            }
            if(path.length>1){
                obj=getValueByAryPath(obj,path,undefined,path.length-1);
                if(obj===undefined || obj===null){
                    setConvoScopeError(scope,`reference to undefined var at path - ${name}.${path.join('.')}`);
                    return value;
                }
            }
            obj[path[path.length-1]??'']=value;
        }else{
            vars[name]=value;
        }

        return value;
    }

}
