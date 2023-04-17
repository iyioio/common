import { HashMap, Point } from "@iyio/common";
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
    important?:boolean;
    source?:boolean;
    copySource?:boolean;
    question?:boolean;
    hash?:boolean;
    ex?:boolean;
    less?:boolean;
    equals?:boolean;
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
