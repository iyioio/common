import type { ZodObject } from 'zod';
import type { Conversation } from './Conversation';
import type { ConvoExecutionContext } from './ConvoExecutionContext';

export type ConvoMessageType='text'|'function';

export const convoValueConstants=['true','false','null','undefined'] as const;
export type ConvoValueConstant=(typeof convoValueConstants)[number];

export const convoNonFuncKeywords=['in'] as const;
export type ConvoNonFuncKeyword=(typeof convoNonFuncKeywords)[number];


export const convoObjFlag='**convo**'

export interface ConvoTag
{
    name:string;
    value?:string;
}

export type ConvoErrorType=(
    'invalid-return-value-type'|
    'function-call-parse-count'|
    'unexpected-base-type'|
    'invalid-args'|
    'proxy-call-not-supported'|
    'function-not-defined'|
    'function-return-type-not-defined'|
    'function-args-type-not-defined'|
    'function-args-type-not-an-object'|
    'suspended-scheme-statements-not-supported'|
    'zod-object-expected'|
    'scope-already-suspended'|
    'scope-waiting'|
    'suspension-parent-not-found'
);

export interface ConvoErrorReferences
{
    message?:ConvoMessage;
    fn?:ConvoFunction;
    statement?:ConvoStatement;
    statements?:ConvoStatement[];
    completion?:ConvoCompletionMessage;
    baseType?:ConvoBaseType;
}

/**
 * Can be a text message or function definition
 */
export interface ConvoMessage
{
    role?:string;
    content?:string;
    statement?:ConvoStatement;
    fn?:ConvoFunction;
    tags?:ConvoTag[]

}

export interface ConvoStatement
{
    /**
     * Raw value
     */
    value?:any;

    /**
     * name of function to invoke
     */
    fn?:string;

    /**
     * Dot path used with fn
     */
    fnPath?:string[];

    /**
     * Args to pass to fn if defined
     */
    params?:ConvoStatement[];

    /**
     * Name of a variable to set the function call result or value to.
     */
    set?:string;

    /**
     * Dot path used with set
     */
    setPath?:string[];

    /**
     * Name of a referenced variable
     */
    ref?:string;

    /**
     * Dot path used with ref
     */
    refPath?:string[];

    /**
     * Label optional - If true the statement is option. Used in com
     */
    opt?:boolean;

    /**
     * Statement label
     */
    label?:string;

    /**
     * Name of a non function keyword
     */
    keyword?:string;

    comment?:string;

    tags?:ConvoTag[];

    /**
     * If true the statement has the shared tag and assignment of variables will be stored in the
     * shared variable scope.
     */
    shared?:boolean;

    /**
     * Source index start
     */
    s:number;

    /**
     * Source index end. The index is non-inclusive.
     */
    e:number;

    /**
     * Source index close. Only used with function calls. The index is non-inclusive.
     */
    c?:number;
}

export interface ConvoFunction
{
    name:string;

    modifiers:string[];

    /**
     * Name of a type variable that the function returns. If undefined the function
     * can return any type.
     */
    returnType?:string;

    /**
     * If true the function is a local statement that should only be called by other functions in the
     * current convo script
     */
    local:boolean;
    /**
     * If true it has been requested that the function be called.
     */
    call:boolean;

    /**
     * If true the function is a collection of top level statements
     */
    topLevel:boolean;

    /**
     * If true the function only defines types
     */
    definitionBlock?:boolean;


    description?:string;

    /**
     * The body statements of the function. If a function does not have a body then it is either
     * a function interface or a call or called statement.
     */
    body?:ConvoStatement[];
    params:ConvoStatement[];
    paramType?:string;
}

export interface ConvoParsingResult
{
    messages:ConvoMessage[];
    error?:ConvoParsingError;
    endIndex:number;
}

export interface ConvoParsingError
{
    message:string;
    index:number;
    lineNumber:number;
    line:string;
    near:string;
}

export interface ConvoError
{
    message:string;
    error?:any;
    statement?:ConvoStatement;
}

export interface OptionalConvoValue<T=any>
{
    [convoObjFlag]:'optional';
    value?:T;

}
export const isOptionalConvoValue=(value:any):value is OptionalConvoValue=>(value as OptionalConvoValue)?.[convoObjFlag]==='optional';


export const convoFlowControllerKey=Symbol('convoFlowControllerKey')
export interface ConvoFlowController
{

    /**
     * If true only the last param value is stored in the scopes param value array
     */
    discardParams?:boolean;

    usesLabels?:boolean;

    /**
     * If true return control flow should be caught
     */
    catchReturn?:boolean;

    sourceFn?:ConvoFunction;

    nextParam?(
        scope:ConvoScope,
        parentScope:ConvoScope|undefined,
        paramStatement:ConvoStatement,
        ctx:ConvoExecutionContext
    ):number|false;

    shouldExecute?(
        scope:ConvoScope,
        parentScope:ConvoScope|undefined,
        ctx:ConvoExecutionContext
    ):boolean;

    transformResult?(
        value:any,
        scope:ConvoScope,
        parentScope:ConvoScope|undefined,
        ctx:ConvoExecutionContext
    ):any;
}

export type ConvoScopeFunction=(scope:ConvoScope,ctx:ConvoExecutionContext)=>any;

export const convoScopeFnKey=Symbol('convoScopeFnKey');
export const convoScopeParentKey=Symbol('convoScopeParentKey');

export interface ConvoScope
{
    /**
     * suspension id
     */
    si?:string;

    onComplete?:((value:any)=>void)[];

    onError?:((error:any)=>void)[];

    /**
     * value
     */
    v?:any;

    /**
     * If true the control flow should return from the current function
     */
    r?:boolean;

    /**
     * index
     */
    i:number;

    s:ConvoStatement;


    /**
     * Wait id. Id of another scope to wait for before resuming
     */
    wi?:string;

    /**
     * Parent suspension id
     */
    pi?:string;

    /**
     * Suspension Finished
     */
    fi?:boolean;

    [convoScopeFnKey]?:ConvoScopeFunction;

    /**
     * Param values used with function statements
     */
    paramValues?:any[];

    /**
     * Maps label names to param indexes
     */
    labels?:Record<string,number|OptionalConvoValue<number>>;

    error?:ConvoError;

    /**
     * If true the scope is defining a type
     */
    td?:boolean;

    ctrlData?:any;

    fromIndex?:number;

    gotoIndex?:number;

    /**
     * Variable scope for the scope. When a function is executed all scopes generated will share the
     * same vars scope object. This is important to remember when serializing scope objects.
     */
    vars:Record<string,any>;

    /**
     * If true the scope is used as the default scope object. This property is used for internal
     * optimization and should be ignored
     */
    _d?:boolean;
}

export const convoBaseTypes=['string','number','int','boolean','time','void','any','map','array'] as const;
export type ConvoBaseType=(typeof convoBaseTypes)[number];
export const isConvoBaseType=(value:any):value is ConvoBaseType=>convoBaseTypes.includes(value);

export interface ConvoTypeDef
{
    [convoObjFlag]:'type';
    type:string;
    enumValues?:any[];
}
export const isConvoTypeDef=(value:any):value is ConvoTypeDef=>(value as ConvoTypeDef)?.[convoObjFlag]==='type';

export interface FlatConvoMessage
{
    role:string;
    content?:string;
    fn?:ConvoFunction;
    fnParams?:ZodObject<any>;
}

export interface ConvoCompletionMessage
{
    role?:string;
    content?:string;
    callFn?:string;
    callParams?:any;
}

export interface ConvoCompletionService
{
    completeConvoAsync(flat:FlatConvoConversation):Promise<ConvoCompletionMessage[]>;
}

export interface ConvoCompletion
{
    message?:ConvoCompletionMessage;
    messages:ConvoCompletionMessage[];
    error?:any;
    exe?:ConvoExecutionContext;
    returnValues?:any[];
}

export interface FlatConvoConversation
{
    exe:ConvoExecutionContext;
    messages:FlatConvoMessage[];
    conversation:Conversation;
}

export interface ConvoExecuteResult
{
    value?:any;
    valuePromise?:Promise<any>
}
