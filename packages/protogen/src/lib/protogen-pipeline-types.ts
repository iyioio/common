import { CliArgsAliasMap, CliArgsConverter, HashMap } from "@iyio/common";
import { z, ZodSchema } from "zod";
import { ProtoSourceCodeMerger } from "./output-utils";
import { ProtoNode } from "./protogen-types";

export type ProtoStage='init'|'input'|'preprocess'|'parse'|'generate'|'output';

export interface ProtoIndexGenerator
{
    root:string;
    recursive?:boolean;
    generator:(ctx:ProtoContext,generator:ProtoIndexGenerator,generatorOutput:ProtoOutput)=>string|Promise<string>;
    /**
     * Array of filenames, full paths or regular expresses to exclude from the index
     */
    exclude?:(string|RegExp)[];
}

export interface ProtoOutput
{
    path:string;
    content:string;
    autoMerge?:boolean;
    mergeHandler?:ProtoSourceCodeMerger|((ProtoSourceCodeMerger|null|undefined)[]);
    generator?:ProtoIndexGenerator;
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
    args:{[name:string]:any};
    inputs:string[];
    sources:ProtoSource[];
    nodes:ProtoNode[];
    outputs:ProtoOutput[];
    verbose:boolean;
    tab:string;
    stage:ProtoStage;
    namespace:string;
    importMap:HashMap<string>;
    packagePaths:HashMap<string[]>;
    metadata:{[name:string]:any};
    dryRun:boolean;
    log:(...values:any[])=>void;

}

export type ProtoPipelineCallback<TConfig>=(ctx:ProtoContext,config:TConfig,pluginInfo:ProtoPipelinePluginInfo)=>void|Promise<void>;

export interface ProtoPipelineConfigurablePlugin<TConfigScheme extends ZodSchema, TConfig=z.infer<TConfigScheme>>
{
    configScheme:TConfigScheme;
    beforeAll?:ProtoPipelineCallback<TConfig>;
    beforeEach?:ProtoPipelineCallback<TConfig>;
    stage?:ProtoPipelineCallback<TConfig>;
    init?:ProtoPipelineCallback<TConfig>;
    input?:ProtoPipelineCallback<TConfig>;
    preprocess?:ProtoPipelineCallback<TConfig>;
    parse?:ProtoPipelineCallback<TConfig>;
    generate?:ProtoPipelineCallback<TConfig>;
    output?:ProtoPipelineCallback<TConfig>;
    afterEach?:ProtoPipelineCallback<TConfig>;
    afterAll?:ProtoPipelineCallback<TConfig>;
}

export type ProtoPipelinePlugin=Omit<ProtoPipelineConfigurablePlugin<any,null>,'configScheme'>;


export interface ProtoPipelinePluginInfo
{
    name:string;
    source:string;
    paths:string[];
    plugin:ProtoPipelinePlugin|ProtoPipelineConfigurablePlugin<any,any>;
}
export interface ProtoPipeline
{

    config:ProtoPipelineConfig;

    context:ProtoContext;

    plugins:ProtoPipelinePluginInfo[];
}


export interface ProtoPipelineConfig
{
    inputs?:string[];
    plugins?:string[];
    workingDirectory?:string;
    verbose?:boolean;
    loadDefaultPlugins?:boolean;
    namespace?:string;
    logImportMap?:boolean;
    dryRun?:boolean;
    disablePlugins?:string[];
}

export const ProtoCliAliases:CliArgsAliasMap<ProtoPipelineConfig>={
    inputs:'-i',
    plugins:'-p',
    workingDirectory:'-d',
    verbose:'-v',
    loadDefaultPlugins:'-l',
    namespace:'-n',
    disablePlugins:'-x'
} as const;

export const ProtoPipelineConfigCliConverter:CliArgsConverter<ProtoPipelineConfig>={
    inputs:(args:string[])=>args,
    plugins:(args:string[])=>args,
    workingDirectory:(args:string[])=>args[0],
    namespace:(args:string[])=>args[0],
    verbose:(args:string[])=>Boolean(args[0]),
    logImportMap:(args:string[])=>Boolean(args[0]),
    dryRun:(args:string[])=>Boolean(args[0]),
    loadDefaultPlugins:(args:string[])=>Boolean(args[0]),
    disablePlugins:(args:string[])=>args,
} as const;
