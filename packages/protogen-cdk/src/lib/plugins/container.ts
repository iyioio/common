import { defaultContainerIgnoreOverrides } from "@iyio/cdk-common";
import { getDirectoryName, joinPaths, safeParseNumberOrUndefined } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, protoAddContextParam, protoChildrenToStringRecordOrUndefined, protoGetParamName, protoNodeChildrenToAccessRequests, protoNodeChildrenToGrantAccessRequests } from "@iyio/protogen";
import { z } from "zod";
import { ContainerInfoTemplate, containerCdkTemplate } from "./containerCdkTemplate.js";

const supportedTypes=['container'];

const ContainerPluginConfig=z.object(
{
    /**
     * @default "Containers"
     */
    containerCdkConstructClassName:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the user pool
     */
    containerCdkConstructFile:z.string().optional(),
})

export const containerPlugin:ProtoPipelineConfigurablePlugin<typeof ContainerPluginConfig>=
{
    configScheme:ContainerPluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        libStyle,
        paramMap,
        paramPackage,
        importMap
    },{
        containerCdkConstructClassName='Containers',
        containerCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${containerCdkConstructClassName}.ts`:undefined,
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        for(const node of supported){
            protoAddContextParam(node.name+'TaskArn',paramPackage,paramMap,importMap);
            protoAddContextParam(node.name+'ServiceArn',paramPackage,paramMap,importMap);
        }

        if(containerCdkConstructFile){
            outputs.push({
                path:containerCdkConstructFile,
                content:containerCdkTemplate(containerCdkConstructClassName,supported.map<ContainerInfoTemplate>(q=>{
                    const c=q.children??{};
                    const pkg=c['package']?.value;
                    const file=c['file']?.value;
                    const dir=c['fullDir']?.value??(
                        c['dir']?.value?
                            joinPaths('../..',c['dir']?.value)
                        :pkg?
                            joinPaths('../../packages',pkg)
                        :c['rootDir']?
                            '../..'
                        :file?
                            joinPaths('../..',getDirectoryName(file))
                        :
                            '.'
                    );
                    const cmdV=c['cmd']?.value;
                    const cmd=cmdV?JSON.parse(cmdV):undefined;
                    const ignoreOverrides=c['ignoreOverrides']?.value;
                    if(cmd && !Array.isArray(cmd)){
                        throw new Error('container cmd should be a string array')
                    }
                    const info:ContainerInfoTemplate={
                        grantAccess:true,
                        name:q.name,
                        dir,
                        file:file,
                        serviceArnParam:protoGetParamName(q.name+'ServiceArn'),
                        taskArnParam:protoGetParamName(q.name+'TaskArn'),
                        vCpuCount:safeParseNumberOrUndefined(c['vCpuCount']?.value),
                        memoryMb:safeParseNumberOrUndefined(c['memoryMb']?.value),
                        cpuArchitecture:c['cpuArchitecture']?.value as any,
                        env:protoChildrenToStringRecordOrUndefined(c['env']?.children),
                        port:safeParseNumberOrUndefined(c['port']?.value),
                        enableExecuteCommand:c['enableExecuteCommand']?true:undefined,
                        healthCheckPath:c['healthCheckPath']?.value,
                        healthCheckCmd:c['healthCheckCmd']?.value,
                        healthCheckIntervalSeconds:safeParseNumberOrUndefined(c['healthCheckIntervalSeconds']?.value),
                        healthCheckRetries:safeParseNumberOrUndefined(c['healthCheckRetries']?.value),
                        healthCheckTimeoutSeconds:safeParseNumberOrUndefined(c['healthCheckTimeoutSeconds']?.value),
                        healthCheckStartSeconds:safeParseNumberOrUndefined(c['healthCheckStartSeconds']?.value),
                        enableScaling:c['enableScaling']?true:undefined,
                        minInstanceCount:safeParseNumberOrUndefined(c['minInstanceCount']?.value),
                        maxInstanceCount:safeParseNumberOrUndefined(c['maxInstanceCount']?.value),
                        targetCpuUsage:safeParseNumberOrUndefined(c['targetCpuUsage']?.value),
                        scaleUpSeconds:safeParseNumberOrUndefined(c['scaleUpSeconds']?.value),
                        scaleDownSeconds:safeParseNumberOrUndefined(c['scaleDownSeconds']?.value),
                        ec2Type:c['ec2Type']?.value,
                        privileged:c['privileged']?true:undefined,
                        sharedMemorySizeMb:safeParseNumberOrUndefined(c['sharedMemorySizeMb']?.value),
                        cmd,
                        ignoreOverrides:(
                            !ignoreOverrides?
                                undefined
                            :ignoreOverrides.startsWith('+')?
                                [...defaultContainerIgnoreOverrides,...ignoreOverrides.split(',').map(i=>i.trim())]
                            :
                                ignoreOverrides.split(',').map(i=>i.trim())
                        )
                    }
                    const accessProp=c['$access'];
                    if(accessProp?.children){
                        info.accessRequests=protoNodeChildrenToAccessRequests(accessProp);
                    }

                    const grantAccessProp=c['$grant-access'];
                    if(grantAccessProp?.children){
                        info.grantAccessRequests=protoNodeChildrenToGrantAccessRequests(q.name,grantAccessProp);
                    }

                    if(c['$no-passive-access']){
                        info.noPassiveAccess=true;
                    }
                    return info;
                }),importMap)
            })
        }
    }
}
