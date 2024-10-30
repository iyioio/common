import { ApiRoute, BucketSiteContentSource, SiteInfo } from "@iyio/cdk-common";
import { joinPaths, strFirstToUpper } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, protoGetChildrenByName, protoMergeJson } from "@iyio/protogen";
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
        libStyle,
        cdkProjectDir,
        metadata
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

            metadata['screens-path-'+name]=`packages/${name}/pages`

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

            if(nextJsAppCdkConstructFile){
                outputs.push({
                    path:joinPaths(cdkProjectDir,'project.json'),
                    content:JSON.stringify({
                        implicitDependencies:[name]
                    }),
                    mergeHandler:protoMergeJson
                })
            }

            const deploymentType=node.children?.['deploy']?.value?.trim();
            if(deploymentType){
                switch(deploymentType){

                    case 'static':{
                        const redirectHandler=node.children?.['redirectHandler']?.type;
                        if(redirectHandler && !nodes.find(n=>n.name===redirectHandler)){
                            throw new Error(`redirectHandler type not found. type:${redirectHandler}, appName:${node.name}`);
                        }
                        const domains=protoGetChildrenByName(node,'domain',false);
                        const bucketSources=protoGetChildrenByName(node,'bucketSource',false);
                        const ignorePaths=protoGetChildrenByName(node,'ignorePath',false);
                        const routes:ApiRoute[]=[];
                        const routeNodes=protoGetChildrenByName(node,'route',false);
                        for(const child of routeNodes){
                            const path=child.children?.['path']?.value;
                            const target=child.children?.['target']?.value;
                            if(!path || !target){
                                continue;
                            }
                            const route:ApiRoute={
                                path,
                                targetName:target
                            }
                            routes.push(route);
                        }
                        sites.push({
                            name:strFirstToUpper(name.replace(/-(\w)/g,(_,c:string)=>c.toUpperCase())),
                            redirectHandler,
                            envPattern:node.children?.['$envPattern']?.value,
                            staticSite:{
                                routes:routes.length?routes:undefined,
                                ignorePaths:ignorePaths.length?ignorePaths.map(p=>p.value??'').filter(v=>v):undefined,
                                nxExportedPackage:name,
                                cdn:true,
                                cdnCors:node.children?.['cors']?true:undefined,
                                domainName:domains[0]?.value?.trim(),
                                additionalDomainNames:domains.length>1?domains.map(d=>d.value?.trim()).filter((d,i)=>d && i>0) as string[]:undefined,
                                createOutputs:true,
                                fallbackBucket:node.children?.['fallbackBucket']?.value,
                                bucketSources:bucketSources?bucketSources.map(n=>{
                                    const name=n.children?.['bucket']?.value;
                                    const pattern=n.children?.['pattern']?.value;
                                    if(!name){
                                        throw new Error(`nextApp(${node.name}) bucketSource requires a bucket to be defined`);
                                    }
                                    if(!pattern){
                                        throw new Error(`nextApp(${node.name}) bucketSource requires a pattern to be defined`);
                                    }
                                    const source:BucketSiteContentSource={
                                        bucket:name,
                                        pattern,
                                        originPath:n.children?.['originPath']?.value,
                                        fallbackBucket:n.children?.['fallbackBucket']?.value,
                                        fallbackOriginPath:n.children?.['fallbackOriginPath']?.value,

                                    }
                                    return source;
                                }):undefined

                            }
                        })

                        break;
                    }

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
