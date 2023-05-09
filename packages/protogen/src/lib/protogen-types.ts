import { HashMap, Point } from "@iyio/common";
import { ZodError, ZodSchema } from "zod";
import { ProtoPipelineConfig } from "./protogen-pipeline-types";

export interface ProtoConfig
{
    pipeline:ProtoPipelineConfig;
    defaultFile?:string;
    saveDir?:string;
    snapshotDir?:string;
}

export interface ProtoTypeInfo
{
    type:string;
    isArray?:boolean;
    path:string[];
    isRefType?:boolean;
    /**
     * modifier character = *
     */
    important?:boolean;
    /**
     * modifier character = >
     */
    source?:boolean;
    /**
     * modifier character = @
     */
    copySource?:boolean;
    /**
     * modifier character = ?
     */
    question?:boolean;
    /**
     * modifier character = #
     */
    hash?:boolean;
    /**
     * modifier character = !
     */
    ex?:boolean;
    /**
     * modifier character = ~
     */
    less?:boolean;
    /**
     * modifier character = =
     */
    equals?:boolean;
    /**
     * modifier character = .
     */
    dot?:boolean;

    /**
     * The package where the type is defined
     */
    package?:string;

    /**
     * The name used to export the type from its package
     */
    exportName?:string;

    /**
     * Set when the type is being used as a variable, arg, param etc.
     */
    varName?:string;
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

export type ProtoLinkPriority='low'|'med'|'high';

export interface ProtoLink
{
    name?:string;
    address:string;

    /**
     * Low priority
     */
    priority?:ProtoLinkPriority;


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

    /**
     * If true the node's value was defined directly and is not a direct representation of the
     * node's type.
     */
    valueEq?:boolean;

    hidden?:boolean;

    special?:boolean;

    contentFocused?:boolean;

    isContent?:boolean;

    importantContent?:boolean;

    section?:string;

    tags?:string[];

    sourceAddress?:string;

    sourceLinked?:boolean;

    /**
     * If true the value from the source of the node should be copied to the node
     */
    copySource?:boolean;
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


export interface ProtoParsingResult
{
    rootNodes:ProtoNode[];
    allNodes:ProtoNode[];
    addressMap:ProtoAddressMap;
}


export interface ProtoCallable
{
    name:string;
    /**
     * Name of the function used to invoke the callable. In some cases this will be the same as the
     * name property. In other cases there may be a separate client function with a different name
     * used to call the callable
     */
    exportName:string;
    package:string;

    args:ProtoTypeInfo[];
    argsExportName?:string;
    argsPackage?:string;

    returnType?:ProtoTypeInfo;

    isAsync?:boolean;

    /**
     * An implementation for the callable. This will typically be defined by generated code.
     */
    implementation?:(...args:any)=>any;

    argsScheme?:ZodSchema;
}

export class ProtoCallableNotImplementedError extends Error{}

export class InvalidProtoCallableArgsError extends Error
{
    public readonly zodError:ZodError;

    public constructor(message:string,zodError:ZodError)
    {
        super(message);
        this.zodError=zodError;
    }
}
