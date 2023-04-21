import { ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { nextJsAppTemplate } from "./nextJsAppTemplate";

const supportedTypes=['nextApp'];

const NextJsPluginConfig=z.object(
{

    /**
     * @default false
     */
    nextJsAppOverrideTemplateFiles:z.boolean().optional(),
})

export const nextJsAppPlugin:ProtoPipelineConfigurablePlugin<typeof NextJsPluginConfig>=
{
    configScheme:NextJsPluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        namespace,
    },{
        nextJsAppOverrideTemplateFiles=false
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

            outputs.push(...nextJsAppTemplate({
                mapOptions:{
                    targetDir:`packages/${name}`,
                    outputDefaults:{
                        overwrite:nextJsAppOverrideTemplateFiles
                    }
                },
                projectName:name,
                namespace:node.children?.['namespace']?.value?.trim()??namespace,
                compLib:node.children?.['compLib']?.value?.trim()??'components',
                frontendModule:node.children?.['frontendModule']?.value?.trim()??'frontendModule',
                frontendLib:node.children?.['frontendLib']?.value?.trim()??'frontend',
                siteTitle:node.children?.['siteTitle']?.value?.trim()??name,
                siteDescription:node.children?.['siteDescription']?.value?.trim()??name,
                devPort:node.children?.['devPort']?.value?.trim()??'4200',
            }));

        }


    }
}
