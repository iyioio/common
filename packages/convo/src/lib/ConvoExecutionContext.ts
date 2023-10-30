import { getValueByAryPath, isPromise } from '@iyio/common';
import { ZodObject } from 'zod';
import { defaultConvoVars } from "./convo-default-vars";
import { convoBodyFnName, convoMapFnName, createOptionalConvoValue, setConvoScopeError } from './convo-lib';
import { ConvoFlowController, ConvoFunction, ConvoScope, ConvoStatement, convoFlowControllerKey, convoScopeFnKey } from "./convo-types";
import { convoValueToZodType } from './convo-zod';


const argsCacheKey=Symbol('argsCacheKey');


export const executeConvoFunction=(fn:ConvoFunction,args:Record<string,any>={}):Promise<any>|any=>{
    const exe=new ConvoExecutionContext();
    return exe.executeFunction(fn,args);
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

    public constructor()
    {
        this.sharedVars={...defaultConvoVars}
    }

    public executeFunction(fn:ConvoFunction,args:Record<string,any>={}):Promise<any>|any
    {
        const scheme=this.getConvoFunctionArgsScheme(fn);
        const parsed=scheme.safeParse(args);
        if(parsed.success===false){
            throw new Error(`Invalid args passed to convo function. fn = ${fn.name}, message = ${parsed.error.message}`);
        }

        args=parsed.data;

        const vars:Record<string,any>={}

        let scope:ConvoScope={
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

        if(fn.paramsName){
            this.setVar(false,args,fn.paramsName,undefined,scope);
        }

        scope=this.executeScope(scope,undefined,createDefaultScope(vars));

        if(scope.si){
            return new Promise((r,j)=>{
                if(!scope.onComplete){
                    scope.onComplete=[];
                }
                if(!scope.onError){
                    scope.onError=[];
                }
                scope.onComplete.push(r);
                scope.onError.push(j);
            })
        }else{
            if(scope.error){
                throw scope.error;
            }else{
                return scope.v;
            }
        }
    }

    public getConvoFunctionArgsScheme(fn:ConvoFunction,cache=true):ZodObject<any>{
        if(cache){
            const s=(fn as any)[argsCacheKey];
            if(s){
                return s;
            }
        }
        const scheme=this.paramsToScheme(fn.params??[]);
        if(cache){
            (fn as any)[argsCacheKey]=scheme;
        }
        return scheme;
    }

    public paramsToScheme=(params:ConvoStatement[]):ZodObject<any>=>{

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
            console.error('scheme statements should not be suspended',scope,params)
            throw new Error('scheme statements should not be suspended');
        }

        console.log('hio 👋 👋 👋 SCOPE EXECUTED',JSON.stringify(scope,null,4));

        const zType=convoValueToZodType(scope.v);

        if(!(zType instanceof ZodObject)){
            throw new Error('ZodObject expected when converting ConvoStatements to zod type');
        }

        return zType;
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
            const shouldExecute=flowCtrl?.shouldExecute?.(scope,parent,this)??true;
            if(shouldExecute){
                if(statement.params?.length){
                    if(flowCtrl?.usesLabels && !scope.labels){
                        scope.labels={}
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
            if(flowCtrl?.transformResult){
                value=flowCtrl.transformResult(value,scope,parent,this);
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
            throw new Error('Scope already suspended')
        }
        scope.si=(this.nextSuspendId++).toString();
        if(waitFor){
            scope.wi=waitFor.si;
        }
        this.suspendedScopes[scope.si]=scope;
    }

    private completeScope(scope:ConvoScope,parent:ConvoScope|undefined,defaultScope:ConvoScope){

        if(scope.wi){
            throw new Error(`scope waiting on scope(${scope.wi}) before resuming`);
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
                    throw new Error('Suspension parent not found');
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

    private getVar(name:string,path?:string[],scope?:ConvoScope){
        let value=scope?.vars[name]??this.sharedVars[name];
        if(value===undefined && !(name in this.sharedVars)){
            setConvoScopeError(scope,`reference to undefined var - ${name}`);
        }else if(path){
            value=getValueByAryPath(value,path);
        }
        return value;
    }

    private setVar(shared:boolean|undefined,value:any,name:string,path?:string[],scope?:ConvoScope){

        if(name in defaultConvoVars){
            setConvoScopeError(scope,'Overriding builtin var not allowed');
            return value;
        }

        const vars=(shared || !scope)?this.sharedVars:scope.vars;

        if(path){
            let obj=vars[name];
            if(obj===undefined || obj===null){
                setConvoScopeError(scope,`reference to undefined var - ${name}`);
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
