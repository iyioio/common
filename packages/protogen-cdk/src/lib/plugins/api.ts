import { HttpMethod, safeParseNumberOrUndefined } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, protoAddContextParam, protoChildrenToStringArrayOrUndefined, protoGetChildrenByNameOrUndefined, protoGetParamName } from "@iyio/protogen";
import { z } from "zod";
import { ApiInfoTemplate, apiCdkTemplate } from "./apiCdkTemplate.js";

const supportedTypes=['api'];

const ApiPluginConfig=z.object(
{
    /**
     * @default "Apis"
     */
    apiCdkConstructClassName:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the user pool
     */
    apiCdkConstructFile:z.string().optional(),
})

export const apiPlugin:ProtoPipelineConfigurablePlugin<typeof ApiPluginConfig>=
{
    configScheme:ApiPluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        libStyle,
        paramMap,
        paramPackage,
        importMap
    },{
        apiCdkConstructClassName='Apis',
        apiCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${apiCdkConstructClassName}.ts`:undefined,
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        for(const node of supported){
            protoAddContextParam(node.name+'Url',paramPackage,paramMap,importMap);
            protoAddContextParam(node.name+'Domain',paramPackage,paramMap,importMap);
            protoAddContextParam(node.name+'DefaultDomain',paramPackage,paramMap,importMap);
        }

        if(apiCdkConstructFile){
            outputs.push({
                path:apiCdkConstructFile,
                content:apiCdkTemplate(apiCdkConstructClassName,supported.map<ApiInfoTemplate>(q=>{
                    const c=q.children??{};
                    const cors=protoChildrenToStringArrayOrUndefined('cors',c);
                    const info:ApiInfoTemplate={
                        name:q.name,
                        cors:cors??(c['cors']?true:false),
                        port:safeParseNumberOrUndefined(c['port']?.value),
                        isPublic:c['public']?true:undefined,
                        domainNames:protoChildrenToStringArrayOrUndefined('domain',c),
                        urlParam:protoGetParamName(q.name+'Url'),
                        domainParam:protoGetParamName(q.name+'Domain'),
                        defaultDomainParam:protoGetParamName(q.name+'DefaultDomain'),
                        routes:protoGetChildrenByNameOrUndefined(q,'route',false)?.map(n=>({
                            path:n.children?.['path']?.value??'/',
                            targetName:n.children?.['target']?.value,
                            methods:protoGetChildrenByNameOrUndefined(n,'method',false)?.map(m=>m.value?.toUpperCase()).filter(v=>v) as HttpMethod[],
                            auth:protoGetChildrenByNameOrUndefined(n,'auth',false)?.map(a=>({
                                managedName:a.value,
                                method:a.children?.['method']?.value?.toUpperCase() as HttpMethod,
                                roles:protoGetChildrenByNameOrUndefined(n,'role',false)?.map(r=>r.value).filter(v=>v) as string[]
                            }))
                        })),
                    }
                    return info;
                }),importMap)
            })
        }
    }
}
