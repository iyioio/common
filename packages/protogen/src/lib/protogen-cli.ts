import { parseCliArgsT } from "@iyio/common";
import { ProtoCliAliases, ProtoPipelineConfigCliConverter } from "./protogen-pipeline-types.js";

export const protoCliFlags={
    input:'-i',
    loadPlugin:'-l',
    loadPluginPath:'-lp',
    output:'-o',
    reader:'-r',
    parser:'-p',
    generator:'-g',
    writer:'-w',
    workingDirectory:'-d',
    verbose:'-v',
    noDefaultPlugins:'--no-default-plugins',
} as const;


export const protoParseCliArgs=(argList:string[],argStart:number)=>{
    const {argMap:args,parsed:config}=parseCliArgsT({
        args:argList,
        startIndex:argStart,
        aliasMap:ProtoCliAliases,
        converter:ProtoPipelineConfigCliConverter
    });

    return {args,config}
}
