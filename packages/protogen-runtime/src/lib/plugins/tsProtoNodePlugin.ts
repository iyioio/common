import { deepClone, joinPaths } from "@iyio/common";
import { getProtoPluginPackAndPath, protoCreateNodeAddressMap, ProtoPipelineConfigurablePlugin, protoRemoveDisplayChildren } from "@iyio/protogen";
import { z } from "zod";

const TsProtoNodePluginConfig=z.object(
{
    /**
     * @default .tsProtoNodePackage
     */
    tsProtoNodePath:z.string().optional(),

    /**
     * @default "types"
     */
    tsProtoNodePackage:z.string().optional(),

    /**
     * @default "protoNodes.ts"
     */
    tsProtoNodeFilename:z.string().optional(),

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
    },{
        tsProtoNodePackage='types',
        tsProtoNodePath=tsProtoNodePackage,
        tsProtoNodeFilename='protoNodes.ts',
        tsProtoNodeExportName='protoNodes',
        tsProtoNodeMinify=false,
    })=>{

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            tsProtoNodePackage,
            tsProtoNodePath
        );

        log(`${nodes.length} node(s)`);

        importMap[tsProtoNodeExportName]=packageName;

        outputs.push({
            path:joinPaths(path,tsProtoNodeFilename),
            content:
`import { ProtoAddressMap } from '@iyio/protogen';

export const ${tsProtoNodeExportName}=${JSON.stringify(
    protoCreateNodeAddressMap(protoRemoveDisplayChildren(deepClone(nodes))),
null,tsProtoNodeMinify?0:tab.length)} satisfies ProtoAddressMap;`,
        })

    }
}
