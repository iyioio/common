import { HashMap, Point } from "@iyio/common";


export interface ProtoTypeInfo
{
    type:string;
    isArray?:boolean;
    flags?:string[];
    path:string[];
    isRefType?:boolean;
}

export type ProtoChildren={[name:string]:ProtoNode}
export type ProtoAddressMap={[address:string]:ProtoNode}

export interface ProtoNodeRenderData
{
    indent?:string;
    input?:string;
    depth?:number;
    before?:string;
}

export interface ProtoLink
{
    name?:string;
    address:string;

    /**
     * Low priority
     */
    low?:boolean;


    color?:string;
    /**
     * If true the link is the reverse side of a user defined link
     */
    rev?:boolean;
    meta?:HashMap<string>;

    /**
     * If true the link is a source reference
     */
    src?:boolean;

    broken?:boolean;
}

export interface ProtoNode{

    name:string;

    type:string;

    /**
     * The reference or secondary type of the node. The second type in types.
     */
    refType?:ProtoTypeInfo;

    optional?:boolean;

    /**
     * All types the node implements
     */
    types:ProtoTypeInfo[];

    comment?:string;// move to get comments

    address:string;
    children?:ProtoChildren;
    value?:string;
    links?:ProtoLink[];
    /**
     * Used by parsing and rending systems. Generators should ignore this value
     */
    renderData?:ProtoNodeRenderData;


    hidden?:boolean;

    special?:boolean;

    contentFocused?:boolean;

    isContent?:boolean;

    importantContent?:boolean;

    section?:string;

    tags?:string[];

    sourceAddress?:string;

    sourceLinked?:boolean;
}

export interface ProtoOutput
{
    name?:string;
    ext:string;
    content:string;
}

export interface ProtoSource
{
    input?:string;
    ext?:string;
    contentType?:string;
    content:string;
}

export interface ProtoContext
{
    executionId:string;
    /**
     * Args passed from the command line
     */
    args:{[name:string]:string[]};
    inputArgs:string[];
    outputArgs:string[];
    sources:ProtoSource[];
    nodes:ProtoNode[];
    outputs:ProtoOutput[];
    verbose:boolean;
    tab:string;
    stage:ProtoStage;
    metadata:{[name:string]:any};
    log:(...values:any[])=>void;
}

/**
 * Callback type used to call plugin while running a protogen pipeline
 */
export type ProtoCallback=(ctx:ProtoContext)=>Promise<void>|void;

export interface ProtoExternalExecutorOptions
{
    action:'run-plugin'|'clean-up';
    plugin?:string;
}

export type ProtoExternalExecutor=(ctx:ProtoContext,options:ProtoExternalExecutorOptions)=>Promise<boolean>

export interface ProtoPipeline
{
    context:ProtoContext;
    readers:ProtoCallback[];
    parsers:ProtoCallback[];
    generators:ProtoCallback[];
    writers:ProtoCallback[];
    plugins:{[name:string]:ProtoCallback};
    externalPlugins:string[];
    externalExecutors:ProtoExternalExecutor[];
}



export type RelationType='one-one'|'one-many'|'many-many'|'node-node';

export interface ProtoLayout
{
    left:number;
    right:number;
    top:number;
    bottom:number;
    y:number;
    disabled?:boolean;
    broken?:boolean;
    node?:ProtoNode;
    getOffset?:(layout:ProtoLayout)=>Point;
    altNode?:ProtoNode;
}

export interface NodeAndPropName
{
    nodeName:string;
    propName?:string;
    meta?:HashMap<string>;
}

export interface ProtoPosScale
{
    x:number;
    y:number;
    width?:number;
    scale:number;
}

export type ProtoStage='preprocess'|'input'|'parse'|'generate'|'output';

export type ProtoPluginCallback=(ctx:ProtoContext)=>Promise<void|boolean>|void|boolean;

export interface ProtoPluginExecutionOptions
{
    preprocess?:ProtoPluginCallback;
    input?:ProtoPluginCallback;
    parse?:ProtoPluginCallback;
    generate?:ProtoPluginCallback;
    output?:ProtoPluginCallback;
}

export interface ProtoParsingResult
{
    rootNodes:ProtoNode[];
    allNodes:ProtoNode[];
    addressMap:ProtoAddressMap;
}
