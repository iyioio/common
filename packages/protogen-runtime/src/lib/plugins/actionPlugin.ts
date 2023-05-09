import { joinPaths } from "@iyio/common";
import { ProtoAction, ProtoExpression, ProtoPipelineConfigurablePlugin, ProtoWorkerGroup, ProtoWorkflow, commonProtoFeatures, getProtoPluginPackAndPath, parseProtoAction, parseProtoExpression, protoGenerateTsIndex, protoGetChildren } from "@iyio/protogen";
import { z } from "zod";

export const actionDataOutputKey='actionWorkflow'

const supportedTypes=['action','expression','workerGroup'];

const ActionPluginConfig=z.object(
{
    /**
     * @default .actionPackage
     */
    actionPath:z.string().optional(),

    /**
     * @default "domain-actions"
     */
    actionPackage:z.string().optional(),

    /**
     * @default "actions"
     */
    actionExportName:z.string().optional(),

    /**
     * @default "actions-index.ts"
     */
    actionIndexFilename:z.string().optional(),

    /**
     * Name of the types used as workers.
     * @default ["Worker"]
     */
    actionWorkerTypes:z.string().array().optional(),
})

export const actionPlugin:ProtoPipelineConfigurablePlugin<typeof ActionPluginConfig>=
{
    configScheme:ActionPluginConfig,
    generate:async ({
        importMap,
        outputs,
        tab,
        dataOutputs,
        log,
        nodes,
        namespace,
        packagePaths,
        libStyle,
        requiredFeatures,
    },{
        actionPackage='domain-actions',
        actionPath=actionPackage,
        actionExportName='actions',
        actionIndexFilename='actions-index.ts',
        actionWorkerTypes=['Worker']
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        requiredFeatures.add(commonProtoFeatures.callables);

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            actionPackage,
            actionPath,
            libStyle,
            {packagePaths,indexFilename:actionIndexFilename}
        );



        const out:string[]=[];
        importMap[actionExportName]=packageName;

        out.push('import { ProtoWorkflow } from "@iyio/protogen";');
        out.push('');

        const actions:ProtoAction[]=[];
        const expressions:ProtoExpression[]=[];
        const workerGroups:Record<string,ProtoWorkerGroup>={};
        const workerNames:string[]=[];
        const workflow:ProtoWorkflow={
            actions,
            expressions,
            workerGroups
        }


        for(const node of supported){

            if(node.types.some(t=>t.type==='action')){
                const action=parseProtoAction(node);
                actions.push(action);
            }

            if(node.types.some(t=>t.type==='expression')){
                const expression=parseProtoExpression({node});
                expressions.push(expression);
            }

            if(node.types.some(t=>t.type==='workerGroup')){
                const children=protoGetChildren(node,false);
                for(const child of children){
                    if(!child.types[0]?.isArray || !actionWorkerTypes.includes(child.type)){
                        continue;
                    }
                    const name=workerNames.includes(node.name)?child.address:node.name;
                    workerGroups[child.address]={
                        name,
                        address:child.address,
                        type:child.types[0],
                    }
                    workerNames.push(name);
                }
            }


        }

        dataOutputs[actionDataOutputKey]=workflow;

        out.push(`export const ${actionExportName}:ProtoWorkflow=`+JSON.stringify(workflow,null,tab.length));

        outputs.push({
            path:joinPaths(path,'actions.ts'),
            content:out.join('\n')
        })

        // add index file
        outputs.push({
            path:joinPaths(path,actionIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })
    }
}

