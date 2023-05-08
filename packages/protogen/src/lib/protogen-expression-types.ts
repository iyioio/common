import { CancelToken } from "@iyio/common";
import { ProtoNode } from "./protogen-types";

/**
 * A ProtoExpression is a representation of a ProtoNode that returns a value when evaluated.
 *
 * Evaluation order:
 * - If the expression's ctrl defines a evalExpression method then return the value returned from the ctrl.
 * - eval subs
 * - if expression is callable call its target with sub values as params and return returned value
 * - if expression defines a path return the value pointed to by the path
 * - if expression static value isn't undefined return static value
 * - return last sub's return value or undefined if no subs defined
 */
export interface ProtoExpression
{

    /**
     * The expressions name.
     */
    name?:string;

    /**
     * A dot notated path to the value to return for this expression. The path is relative to the root
     * node
     */
    path?:string;

    /**
     * The static value of the expression. This value will be returned if the expression does
     * not define a callAddress
     */
    value?:ProtoEvalValue;

    /**
     * Only used by sub expressions that use subs as definitions
     */
    type?:string;

    /**
     * If true the returned value of the expression should be inverted. For example a return value of
     * true would be inverted to false.
     */
    invert?:boolean;

    /**
     * Address of a node to call. This should be the address of a server function or domain function
     * or any other callable node.
     */
    address?:string;

    /**
     * Sub expressions of this expression. If the expression does not define a value the value of the
     * last sub expression is return as the return value of this expression.
     */
    sub?:ProtoExpression[];

    /**
     * Controls the evaluation of the expression. Expression controls are used to implement
     * control flow statements, logic operator and other language features.
     */
    ctrl?:ProtoExpressionCtrlType|ProtoExpressionCtrl;
}

export const builtInProtoExpressionCtrlTypes=[
    'or',
    'and',
    'return',
    'vars',
    'set',
    'inc',
    'dec',
    'pause',
    'resume',
    'props',
    'throw',
    'if',
    'loop',
    'break',
    'continue',
    'add',
    'sub',
    'mul',
    'div',
    'mod',
    'not',
    'eq',
    'neq',
    'lt',
    'mt',
    'lte',
    'mte',
    'bit-and',
    'bit-or',
    'bit-xor',
    'bit-not',
    'bit-shift-left',
    'bit-shift-right',
    'bit-zero-right',
    'condition',
] as const;

export type ProtoExpressionCtrlType=typeof builtInProtoExpressionCtrlTypes[number];

export type ProtoExpressionCtrlBeforeOp='continue'|'skip'|'reset'|'break';
export type ProtoExpressionCtrlAfterOp='continue'|'break'|'reset';

export interface ProtoExpressionCtrl
{
    canResume?(resumeId:string,expression:ProtoExpression,context:ProtoEvalContext):boolean;
    beforeSub?(ctrlData:Record<string,ProtoEvalValue>,sub:ProtoExpression,expression:ProtoExpression,context:ProtoEvalContext):ProtoExpressionCtrlBeforeOp;
    afterSub?(subValue:ProtoEvalValue|ProtoExpressionControlFlowResult,ctrlData:Record<string,ProtoEvalValue>,sub:ProtoExpression,expression:ProtoExpression,context:ProtoEvalContext):ProtoExpressionCtrlAfterOp;
    mergeSubValues?(prevSubValue:ProtoEvalValue,subValue:ProtoEvalValue,ctrlData:Record<string,ProtoEvalValue>,sub:ProtoExpression,expression:ProtoExpression,context:ProtoEvalContext):ProtoEvalValue;
    loop?(_continue:boolean,loopCount:number,ctrlData:Record<string,ProtoEvalValue>,expression:ProtoExpression,context:ProtoEvalContext):boolean;
    result?(value:ProtoEvalValue|ProtoExpressionControlFlowResult,ctrlData:Record<string,ProtoEvalValue>,expression:ProtoExpression,context:ProtoEvalContext):Promise<ProtoEvalValue|ProtoExpressionControlFlowResult>|ProtoEvalValue|ProtoExpressionControlFlowResult;
    skipSubs?:boolean;
    ignorePath?:boolean;
    ignoreValue?:boolean;
    ignoreCall?:boolean;
    ignoreInvert?:boolean;
}

export type ProtoEvalPrimitive=string|number|boolean|null|undefined;
export type ProtoEvalValue=ProtoEvalPrimitive|ProtoEvalValue[]|{[key:string]:ProtoEvalValue};

export interface ProtoEvalFrame
{
    sub?:number;
    ctrlData?:Record<string,ProtoEvalValue>;
    subResults?:Record<string,ProtoEvalValue>;

}
export interface ProtoEvalContext
{
    /**
     * The time when evaluation started
     */
    startTime?:number;


    /**
     * The time when evaluation ended
     */
    endTime?:number;

    lastPause?:number;

    lastResume?:number;

    lastResumeId?:string;

    /**
     * Value of all stored variable values. Keys of the vars property are the full dot path
     * to a variable. For example if a variable is accessed using an address of trigger.vars.saved
     * then the keys is 'trigger.vars.saved'. vars can also include data set by external triggers
     * and or providers.
     */
    vars:Record<string,ProtoEvalValue>;

    /**
     * The number of expressions that have been evaluated
     */
    evalCount:number;

    /**
     * The maximum number of expressions that should be allowed to execute.
     */
    maxEvalCount?:number;

    frames:ProtoEvalFrame[];
}

export type ProtoEvalState='complete'|'paused'|'failed'|'canceled';

export interface ProtoEvalResult
{
    state:ProtoEvalState;
    context:ProtoEvalContext;
    value?:ProtoEvalValue;
    error?:any;
    errorMessage?:string;

}

export interface ParseProtoExpressOptions
{
    node:ProtoNode;
    filterPaths?:string[];
}

export const ProtoExpressionControlFlowFlag=Symbol('ProtoExpressionControlFlowFlag');

export interface ProtoExpressionControlFlowResult
{
    typeFlag:typeof ProtoExpressionControlFlowFlag;
    complete?:boolean;
    continue?:boolean;
    break?:boolean;
    exit?:boolean;
    returnValue?:ProtoEvalValue;
    error?:any;
    errorMessage?:string;
    /**
     * Id of a pause or resume statement
     */
    resumeId?:string;

    canceled?:boolean;
}

export const isProtoExpressionControlFlowResult=(value:any):value is ProtoExpressionControlFlowResult=>
{
    if(!value){
        return false;
    }
    return (value as ProtoExpressionControlFlowResult|undefined)?.typeFlag===ProtoExpressionControlFlowFlag;
}

export type ProtoExpressionCallable=(address:string,props:Record<string,ProtoEvalValue>)=>Promise<ProtoEvalValue|ProtoExpressionControlFlowResult>|ProtoEvalValue|ProtoExpressionControlFlowResult;

export interface ProtoExpressionEngineOptions
{
    context:Partial<ProtoEvalContext>;
    expression:ProtoExpression;
    callableExpressions?:Record<string,ProtoExpression>;
    callables?:Record<string,ProtoExpressionCallable>;
    cancel?:CancelToken;
}
