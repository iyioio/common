import { ZodType } from "zod";
import { Conversation } from "./Conversation";

export interface ConvoGraph
{
    id:string;
    name?:string;
    nodes:ConvoNode[];
    edges:ConvoEdge[];
}

export interface ConvoNodeTypeMetadata
{
    /**
     * The name of the type
     */
    name:string;
}

export interface ConvoNode
{
    /**
     * Unique id of the node
     */
    id:string;

    /**
     * A display name for the node
     */
    name?:string;

    /**
     * Shared convo script that is prefixed to each step of the node
     */
    sharedConvo?:string;

    /**
     * A set of steps the node will execute to generate an output
     */
    steps:ConvoNodeStep[];


    /**
     * If true auto input transforming is disabled. When input is passed to  node and the input
     * does not conform to the input type of the node a input transform step will be added to the
     * start of the node. When `disableAutoTransform` is set to true the auto generated input
     * transform step will not be added.
     */
    disableAutoTransform?:boolean;

    /**
     * Compiled metadata based on the convo scripts of the node
     */
    metadata?:ConvoNodeMetadata;
}

export interface ConvoNodeStep
{
    name?:string;

    /**
     * The convo script for the step
     */
    convo:string;
}

export interface ConvoNodeExecCtx extends ConvoMetadataAndTypeMap
{

    /**
     * Node steps paired with a conversation for execution
     */
    steps:ConvoNodeExecCtxStep[];

    /**
     * Variable defaults passed to the conversations
     */
    defaultVars:Record<string,any>;
}

export interface ConvoNodeExecCtxStep
{
    nodeStep:ConvoNodeStep;
    convo:Conversation;
}

export interface ConvoNodeOutput extends ConvoNodeTypeMetadata
{
    /**
     * The name of the output function. fnName can be used by edges to match to specific output
     * functions
     */
    fnName?:string;
}

export interface ConvoNodeMetadata
{
    /**
     * The input type of the node. If not defined the input type is `any`
     */
    inputType?:ConvoNodeTypeMetadata;

    outputTypes?:ConvoNodeOutput[];
}

export interface ConvoMetadataAndTypeMap
{
    /**
     * Maps types defined by ConvoNodeMetadata to zod objects.
     */
    typeMap:Record<string,ZodType<any>>;

    /**
     * metadata related to a ConvoNode
     */
    metadata:ConvoNodeMetadata;
}

export interface ConvoEdge
{
    id:string;

    /**
     * The node id that the from side of the edge connects to.
     */
    from:string;

    /**
     * Used to match to a specific output function
     */
    fromFn?:string;

    fromType?:string;

    /**
     * The node address that the to side of the edge connects to.
     */
    to:string;

    /**
     * A convo script that can be used to filter. The condition script will not be completed only
     * flatted and checked for a variable named isMatch. If isMatch is true the condition node
     * will be connected to it target node.
     */
    conditionConvo?:string;

    /**
     * Defines conditions for pausing the traversal of a traverser crossing the edge.
     */
    pause?:ConvoTraversalPause;
}

/**
 * Defines conditions for pausing the traversal of a traverser crossing an edge. If empty traversal
 * can be resumed by any user and may be paused indefinitely.
 */
export interface ConvoTraversalPause
{
    /**
     * A delay in milliseconds to delay traversing to the next node. The delay is applied after
     * checking the condition of the edge.
     */
    delayMs?:number;

    /**
     * If true approval from a user is required before allow the traverser to continue
     */
    approvalRequired?:boolean;
}

/**
 * `paused` - Execution is paused due to a ConvoTraversalPause object being assigned to the traverser.
 *
 * `ready` - The traverser is ready to execute a node
 *
 * `transforming-input` - The traverser is transforming input according to the input type of the node the traverser is on.
 *
 * `invoking` - The traverser is executing the invoke script of the node it is on.
 *
 * `invoked` - The traverser has executed a node and is ready to traverse the next edge.
 *
 * `stopped` - The traverser has reached the end of its node path and is stopped and can not resume.
 *
 * `failed` - The traverser has ran into an error and can not resume.
 */
export type ConvoNodeExeState=(
    'paused'|
    'ready'|
    'invoking'|
    'invoked'|
    'stopped'|
    'failed'
);

export interface ConvoTraverser
{
    /**
     * A unique id for the traverser
     */
    id:string;

    exeState:ConvoNodeExeState;

    currentStepIndex:number;

    /**
     * Defines the conditions for pausing the traverser.
     */
    pause?:ConvoTraversalPause;

    /**
     * A timestamp when to resume traversal after being paused.
     */
    resumeAt?:number;

    /**
     * Shared state of the traverser. Nodes can store data in the state object.
     */
    state:Record<string,any>;

    /**
     * Stores the input and output of nodes as the traverser travels
     */
    payload?:any;

    /**
     * Address of the node the traverser is currently at either executing or waiting to execute.
     * When execution is paused the traverser will move to its next node then wait to execute.
     */
    address?:string;

    /**
     * The path the traverser has traveled.
     */
    path?:ConvoEdge[];

    /**
     * Id of the current node the traverser is on.
     */
    currentNodeId?:string;

    /**
     * An error message describing what caused the traverser to fail
     */
    errorMessage?:string;

    /**
     * An optional name for the traverser
     */
    name?:string;

    /**
     * An optional user id to associate with the traverser.
     */
    userId?:string;

    /**
     * An optional user group id to associate with the traverser.
     */
    userGroupId?:string;
}

export interface CreateConvoTraverserOptions
{
    defaults?:Partial<ConvoTraverser>;
}

export interface StartConvoTraversalOptions
{
    createTvOptions?:CreateConvoTraverserOptions;

    /**
     * The edge where the traverser will start. If edge is a string it is converted to an edge
     * with a `to` value of the string value.
     */
    edge:ConvoEdge|string;

    input?:any;

    state?:Record<string,any>;
}

/**
 * An interface that defines common properties for node input
 */
export interface ConvoCommonNodeInput
{
    /**
     * A short chunk of text that can be used to pass any information. For example if the input
     * was a book `text` would be a summary of the book.
     */
    text:string;

    /**
     * The full source of the content. For example if the input was a book `source` would be the
     * full content of the book.
     */
    source?:string;

    title?:string;

    sourceId?:string;

    sourceUrl?:string;

    type?:string;
}

export type ConvoGraphMonitorEventType=(
    'other'|
    'traverser-created'|
    'start-traversal'|
    'traversal-failed'|
    'edge-crossed'|
    'start-exe'|
    'start-invoke'|
    'execute-step'|
    'exe-complete'|
    'traversal-stopped'|
    'convo-result'
)

export interface ConvoGraphMonitorEvent
{
    type:ConvoGraphMonitorEventType;
    text:string;
    node?:ConvoNode;
    traverser?:ConvoTraverser;
    step?:ConvoNodeStep;
    stepIndex?:number;
    edge?:ConvoEdge;
    data?:any;
    pause?:ConvoTraversalPause;
    time:number;
}

export type ConvoEdgeSide='to'|'from';

export interface ConvoGraphStore
{
    getNodeAsync(id:string):Promise<ConvoNode|undefined>;

    putNodeAsync(graph:ConvoNode):Promise<void>;

    deleteNodeAsync(id:string):Promise<void>;


    getNodeEdgesAsync(nodeId:string,side:ConvoEdgeSide):Promise<ConvoEdge[]>;


    getEdgeAsync(id:string):Promise<ConvoEdge|undefined>;

    putEdgeAsync(graph:ConvoEdge):Promise<void>;

    deleteEdgeAsync(id:string):Promise<void>;


    getTraverserAsync(id:string):Promise<ConvoTraverser|undefined>;

    putTraverserAsync(traverser:ConvoTraverser):Promise<void>;

    deleteTraverserAsync(id:string):Promise<void>;
}
