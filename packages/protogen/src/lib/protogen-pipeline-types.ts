import { CliArgsAliasMap, CliArgsConverter, HashMap } from "@iyio/common";
import { ZodSchema, z } from "zod";
import { ProtoSourceCodeMerger } from "./output-utils.js";
import { ProtoCallable, ProtoNode } from "./protogen-types.js";

export type ProtoStage='init'|'input'|'preprocess'|'parse'|'generate'|'output';

export const allProtoLibStyles=['dir','nx'] as const;

export type ProtoLibStyle=typeof allProtoLibStyles[number];

export const defaultProtoLibStyle:ProtoLibStyle='dir';

export interface ProtoIndexGenerator
{
    root:string;
    recursive?:boolean;
    generator:(ctx:ProtoContext,generator:ProtoIndexGenerator,generatorOutput:ProtoOutput,existing:string)=>string|Promise<string>;
    /**
     * Array of filenames, full paths or regular expresses to exclude from the index
     */
    exclude?:(string|RegExp)[];
}

export interface ProtoOutput
{
    path:string;
    content:string;
    /**
     * @default true
     */
    overwrite?:boolean;
    mainExport?:string;
    mainExportAs?:string;
    isPackageIndex?:boolean;
    isAutoPackageIndex?:boolean;
    autoMerge?:boolean;
    mergeHandler?:ProtoSourceCodeMerger|((ProtoSourceCodeMerger|null|undefined)[]);
    generator?:ProtoIndexGenerator;
    /**
     * If true the output should not be modified in anyway. Right now this only disables end of
     * file newlines.
     */
    raw?:boolean;
    metadata?:Record<string|symbol,any>;
}

export interface ProtoSource
{
    input?:string;
    ext?:string;
    contentType?:string;
    content:string;
}

export type ProtoParamType='string'|'number'|'boolean';

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
    writtenOutputs:ProtoOutput[];
    /**
     * Array of paths that will be checked for files that are allowed to be
     * auto deleted. Paths can be files or directories. Ending a directory
     * path with /* will cause auto delete files to be searched for recursivly.
     * A file is allowed to be auto deleted if its first line has an auto delete
     * tag.
     *
     * Auto delete tag example:
     *  <ALLOW_AUTO_DELETE DEPENDENCIES="{comma separated list of depencencies}" />
     */
    autoDeletePaths:string[];
    /**
     * Starts a zero
     */
    generationStage:number;
    verbose:boolean;
    tab:string;
    stage:ProtoStage;
    namespace:string;
    importMap:HashMap<string>;
    packagePaths:HashMap<string[]>;
    metadata:{[name:string]:any};
    dryRun:boolean;
    libStyle:ProtoLibStyle;
    autoIndexPackages:boolean;
    paramMap:Record<string,ProtoParamType>;
    paramPackage:string;
    paramPackageName:string;
    cdkProjectDir:string;
    dataOutputs:Record<string,any>;
    callables:ProtoCallable[];
    requiredFeatures:Set<string>;
    log:(...values:any[])=>void;

}

export type ProtoPipelineCallback<TConfig>=(ctx:ProtoContext,config:TConfig,pluginInfo:ProtoPipelinePluginInfo)=>void|Promise<void>;

export interface ProtoPipelineConfigurablePlugin<TConfigScheme extends ZodSchema, TConfig=z.infer<TConfigScheme>>
{
    configScheme:TConfigScheme;
    /**
     * Allows the plugins to be executed in stages. Each stage is written before the next. This
     * allows the generation of code that depends on other plugins written code.
     * @default 0
     */
    generationStage?:number;
    setGenerationStage?:(context:ProtoContext,plugins:ProtoPipelinePluginInfo[])=>number;
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
    order:number;
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
    plugins?:(string|ProtoPipelinePluginInfo)[];
    workingDirectory?:string;
    verbose?:boolean;
    loadDefaultPlugins?:boolean;
    namespace?:string;
    logImportMap?:boolean;
    dryRun?:boolean;
    disablePlugins?:string[];
    libStyle?:ProtoLibStyle;
    paramPackageName?:string;
    cdkProjectDir?:string;
}

export const ProtoCliAliases:CliArgsAliasMap<ProtoPipelineConfig>={
    inputs:'-i',
    plugins:'-p',
    workingDirectory:'-d',
    verbose:'-v',
    loadDefaultPlugins:'-l',
    namespace:'-n',
    disablePlugins:'-x',
    libStyle:'-s',
} as const;

export const ProtoPipelineConfigCliConverter:CliArgsConverter<ProtoPipelineConfig>={
    inputs:(args:string[])=>args,
    plugins:(args:string[])=>args,
    cdkProjectDir:(args:string[])=>args[0],
    workingDirectory:(args:string[])=>args[0],
    namespace:(args:string[])=>args[0],
    paramPackageName:(args:string[])=>args[0],
    verbose:(args:string[])=>Boolean(args[0]),
    logImportMap:(args:string[])=>Boolean(args[0]),
    dryRun:(args:string[])=>Boolean(args[0]),
    loadDefaultPlugins:(args:string[])=>Boolean(args[0]),
    libStyle:(args:string[])=>allProtoLibStyles.includes(args[0] as any)?args[0] as ProtoLibStyle:undefined,
    disablePlugins:(args:string[])=>args,
} as const;
