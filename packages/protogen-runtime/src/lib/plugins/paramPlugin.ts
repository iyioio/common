import { joinPaths, objHasValues } from "@iyio/common";
import { getProtoPluginPackAndPath, protoGenerateTsIndex, protoMergeTsImports, ProtoParamType, ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";

const ParamPluginConfig=z.object(
{

    /**
     * @default "params-index.ts"
     */
    paramIndexFilename:z.string().optional(),

    /**
     * @default "params.ts"
     */
    paramsFilename:z.string().optional(),
})

export const paramPlugin:ProtoPipelineConfigurablePlugin<typeof ParamPluginConfig>=
{
    configScheme:ParamPluginConfig,
    generate:async ({
        outputs,
        namespace,
        packagePaths,
        libStyle,
        paramPackageName,
        paramMap,
    },{
        paramsFilename='params.ts',
        paramIndexFilename='params-index.ts',
    })=>{

        if(!objHasValues(paramMap)){
            return;
        }

        const {path}=getProtoPluginPackAndPath(
            namespace,
            paramPackageName,
            paramPackageName,
            libStyle,
            {packagePaths:packagePaths,indexFilename:paramIndexFilename}
        )

        const out:string[]=[''];
        const types:ProtoParamType[]=[];
        const defMap={
            'string':'defineStringParam',
            'boolean':'defineBoolParam',
            'number':'defineNumberParam',
        }
        for(const paramName in paramMap){
            const paramType=paramMap[paramName];
            if(!types.includes(paramType)){
                types.push(paramType);
            }
            const shortName=paramName.endsWith('Param')?paramName.substring(0,paramName.length-5):paramName;
            out.push(`export const ${paramName}=${defMap[paramType]}(${JSON.stringify(shortName)});`);
        }

        if(types.includes('string')){
            out.unshift('import { defineStringParam } from "@iyio/common";');
        }
        if(types.includes('number')){
            out.unshift('import { defineNumberParam } from "@iyio/common";');
        }
        if(types.includes('boolean')){
            out.unshift('import { defineBoolParam } from "@iyio/common";');
        }

        outputs.push({
            path:joinPaths(path,paramsFilename),
            content:out.join('\n'),
            mergeHandler:protoMergeTsImports
        })

        // add index file
        outputs.push({
            path:joinPaths(path,paramIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                recursive:true,
                generator:protoGenerateTsIndex
            }
        })
    }
}
