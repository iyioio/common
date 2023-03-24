export interface ProtoAttribute
{
    name:string;
    value:string;
    props:{[name:string]:string};
}

export interface ProtoTypeInfo
{
    type:string;
    isArray:boolean;
}

export interface TGenNode extends ProtoTypeInfo{
    name:string;

    /**
     * The reference or secondary type of the node. The second type in types.
     */
    refType?:ProtoTypeInfo;

    optional:boolean;

    /**
     * All types the node implements
     */
    types:ProtoTypeInfo[];

    comment?:string;

    attributes:{[name:string]:ProtoAttribute};

    children?:TGenNode[];
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
    /**
     * Args passed from the command line
     */
    args:{[name:string]:string[]};
    inputArgs:string[];
    outputArgs:string[];
    sources:ProtoSource[];
    nodes:TGenNode[];
    outputs:ProtoOutput[];
    verbose:boolean;
    tab:string;
    log:(...values:any[])=>void;
}

/**
 * Callback type used to call plugin while running a protogen pipeline
 */
export type ProtoCallback=(ctx:ProtoContext)=>Promise<void>|void;

export interface ProtoPipeline
{
    context:ProtoContext;
    readers:ProtoCallback[];
    parsers:ProtoCallback[];
    generators:ProtoCallback[];
    writers:ProtoCallback[];
    plugins:{[name:string]:ProtoCallback};
}
