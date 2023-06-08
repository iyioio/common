import { protoAddContextParam, protoGetChildrenByName, protoGetParamName, ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { bucketCdkTemplate, BucketInfoTemplate } from "./bucketCdkTemplate";

const supportedTypes=['bucket'];

const BucketPluginConfig=z.object(
{
    /**
     * @default .bucketPackage
     */
    bucketPath:z.string().optional(),

    /**
     * @default "user-pool"
     */
    bucketPackage:z.string().optional(),

    /**
     * @default "user-pool-index.ts"
     */
    bucketIndexFilename:z.string().optional(),

    /**
     * @default "UsrPool"
     */
   bucketCdkConstructClassName:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the user pool
     */
    bucketCdkConstructFile:z.string().optional(),
})

export const bucketPlugin:ProtoPipelineConfigurablePlugin<typeof BucketPluginConfig>=
{
    configScheme:BucketPluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        libStyle,
        paramMap,
        paramPackage,
        importMap
    },{
        //bucketPackage='user-pool',
        //bucketPath=bucketPackage,
        //bucketIndexFilename='user-pool-index.ts',
        bucketCdkConstructClassName='Bucks',
        bucketCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${bucketCdkConstructClassName}.ts`:undefined,
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        for(const node of supported){
            protoAddContextParam(node.name,paramPackage,paramMap,importMap);
        }

        if(bucketCdkConstructFile){
            outputs.push({
                path:bucketCdkConstructFile,
                content:bucketCdkTemplate(bucketCdkConstructClassName,supported.map<BucketInfoTemplate>(b=>{
                    const pathsChildren=protoGetChildrenByName(b,'path',false);
                    const info:BucketInfoTemplate={
                        name:b.name,
                        public:b.children?.['public']?true:false,
                        enableCors:b.children?.['cors']?true:false,
                        versioned:b.children?.['versioned']?true:undefined,
                        arnParam:protoGetParamName(b.name),
                        mountPaths:pathsChildren.length?pathsChildren.map(n=>{
                            const source=n.children?.['source']?.value||'_';
                            const mount=n.children?.['mount']?.value||source;
                            return {
                                sourcePath:(libStyle==='nx'?'../../':'')+source,
                                mountPath:mount,
                            }
                        }):undefined
                    }
                    return info;
                }),importMap)
            })
        }

        // todo - write a client file that can be used with iyio/auth and currentBaseUser -> currentUser
    }
}
