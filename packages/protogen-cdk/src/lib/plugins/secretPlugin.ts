import { strFirstToLower } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, protoAddContextParam } from "@iyio/protogen";
import { z } from "zod";
import { SecretInfoTemplate, secretCdkTemplate } from "./secretCdkTemplate";
//import { secretCdkTemplate } from "./secretCdkTemplate";

const supportedTypes=['secret'];

const SecretPluginConfig=z.object(
{



    /**
     * If defined a CDK construct file will be generated that can be used to deploy the
     * functions
     */
    secretCdkConstructFile:z.string().optional(),

    /**
     * @default "Fns"
     */
    secretCdkConstructClassName:z.string().optional(),
})

export const secretPlugin:ProtoPipelineConfigurablePlugin<typeof SecretPluginConfig>=
{
    configScheme:SecretPluginConfig,
    generate:async ({
        importMap,
        outputs,
        log,
        nodes,
        libStyle,
        paramMap,
        paramPackage,
    },{
        secretCdkConstructClassName='Secrets',
        secretCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${secretCdkConstructClassName}.ts`:undefined,
    })=>{


        const supported=nodes.filter(node=>node.types.some(t=>supportedTypes.includes(t.type)));
        log(`${supported.length} supported node(s)`);

        if(!supported.length){
            return;
        }

        const infos:SecretInfoTemplate[]=[];

        for(const node of supported){
            const paramName=protoAddContextParam(
                strFirstToLower(node.name),paramPackage,paramMap,importMap);

            infos.push({
                name:node.name,
                arnParam:paramName,
            })
        }


        if(secretCdkConstructFile){
            outputs.push({
                path:secretCdkConstructFile,
                content:secretCdkTemplate(secretCdkConstructClassName,infos,importMap),
            })
        }

    }
}
