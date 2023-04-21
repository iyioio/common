import { SiteInfo } from "@iyio/cdk-common";
import { strFirstToUpper } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { nextJsAppTemplate } from "./nextJsAppTemplate";
import { siteCdkTemplate } from "./siteCdkTemplate";

const supportedTypes=['nextApp'];

const NextJsPluginConfig=z.object(
{

    /**
     * @default false
     */
    nextJsAppOverrideTemplateFiles:z.boolean().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy next apps
     */
    nextJsAppCdkConstructFile:z.string().optional(),

    /**
     * @default "Apps"
     */
    nextJsAppCdkConstructClassName:z.string().optional(),
})

export const nextJsAppPlugin:ProtoPipelineConfigurablePlugin<typeof NextJsPluginConfig>=
{
    configScheme:NextJsPluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        namespace,
        libStyle
    },{
        nextJsAppOverrideTemplateFiles=false,
        nextJsAppCdkConstructClassName='Apps',
        nextJsAppCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${nextJsAppCdkConstructClassName}.ts`:undefined,
    })=>{



        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)) && n.children?.['name']?.value?.trim());

        log(`${supported.length} supported node(s)`);

        if(!supported.length){
            return;
        }

        const sites:SiteInfo[]=[];

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

            const deploymentType=node.children?.['deploy']?.value?.trim();
            if(deploymentType){
                switch(deploymentType){

                    case 'static':
                        sites.push({
                            name:strFirstToUpper(name.replace(/-(\w)/g,(_,c:string)=>c.toUpperCase())),
                            staticSite:{
                                nxExportedPackage:name,
                                cdn:true,
                                domainName:node.children?.['domain']?.value,
                                createOutputs:true,
                            }
                        })

                        break;

                    default:
                        throw new Error(`deployment type ${deploymentType} is not supported by nextJsAppPlugin`);

                }
            }

        }


        if(nextJsAppCdkConstructFile){
            outputs.push({
                path:nextJsAppCdkConstructFile,
                content:siteCdkTemplate(nextJsAppCdkConstructClassName,sites),
            })
        }

    }
}
