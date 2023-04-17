import { joinPaths } from "@iyio/common";
import { getProtoPluginPackAndPath, protoGenerateTsIndex, ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['package'];

const PackagePluginConfig=z.object(
{

    /**
     * @default "index"
     */
    packageIndexName:z.string().optional(),
})

export const packagePlugin:ProtoPipelineConfigurablePlugin<typeof PackagePluginConfig>=
{
    configScheme:PackagePluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        namespace,
        packagePaths,
        libStyle,
    },{
        packageIndexName='index'
    })=>{



        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)) && n.children?.['name']?.value?.trim());

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }


        for(const node of supported){

            const name=node.children?.['name']?.value?.trim();
            if(!name){
                continue;
            }

            const indexName=(node.children?.['index']?.value?.trim()??packageIndexName)+'.ts';

             const {path}=getProtoPluginPackAndPath(
                namespace,
                name,
                name,
                libStyle,
                {packagePaths,indexFilename:indexName}
            );

            // add index file
            outputs.push({
                path:joinPaths(path,indexName),
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
}
