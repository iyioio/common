import { deepClone, joinPaths } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, getProtoPluginPackAndPath, protoCreateNodeAddressMap, protoGenerateTsIndex, protoRemoveDisplayChildren } from "@iyio/protogen";
import { z } from "zod";

const TsProtoNodePluginConfig=z.object(
{
    /**
     * @default .tsProtoNodePackage
     */
    tsProtoNodePath:z.string().optional(),

    /**
     * @default "proto-nodes"
     */
    tsProtoNodePackage:z.string().optional(),

    /**
     * @default "protoNodes.ts"
     */
    tsProtoNodeFilename:z.string().optional(),

    /**
     * @default "protoNodes-index.ts"
     */
    tsProtoNodeIndexFilename:z.string().optional(),

    /**
     * @default "protoNodes"
     */
    tsProtoNodeExportName:z.string().optional(),

    /**
     * @default false
     */
    tsProtoNodeMinify:z.boolean().optional(),
})

export const tsProtoNodePlugin:ProtoPipelineConfigurablePlugin<typeof TsProtoNodePluginConfig>=
{
    configScheme:TsProtoNodePluginConfig,
    generate:async ({
        importMap,
        outputs,
        tab,
        log,
        nodes,
        namespace,
        libStyle,
        packagePaths
    },{
        tsProtoNodePackage='proto-nodes',
        tsProtoNodePath=tsProtoNodePackage,
        tsProtoNodeFilename='protoNodes.ts',
        tsProtoNodeExportName='protoNodes',
        tsProtoNodeIndexFilename='protoNodes-index',
        tsProtoNodeMinify=false,
    })=>{

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            tsProtoNodePackage,
            tsProtoNodePath,
            libStyle,
            {packagePaths,indexFilename:tsProtoNodeIndexFilename}
        );

        log(`${nodes.length} node(s)`);

        importMap[tsProtoNodeExportName]=packageName;

        outputs.push({
            path:joinPaths(path,tsProtoNodeFilename),
            content:
`import { ProtoAddressMap } from '@iyio/protogen';

export const ${tsProtoNodeExportName}=${JSON.stringify(
    protoCreateNodeAddressMap(protoRemoveDisplayChildren(deepClone(nodes,1000))),
null,tsProtoNodeMinify?0:tab.length)} satisfies ProtoAddressMap;`,
        })

        outputs.push({
            path:joinPaths(path,tsProtoNodeIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })

    }
}
