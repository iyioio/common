import { joinPaths } from "@iyio/common";
import { ProtoAction, ProtoExpression, ProtoPipelineConfigurablePlugin, ProtoWorkflow, commonProtoFeatures, getProtoPluginPackAndPath, parseProtoAction, parseProtoExpression, protoGenerateTsIndex } from "@iyio/protogen";
import { z } from "zod";

export const actionDataOutputKey='actionWorkflow'

const supportedTypes=['action','expression'];

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
        const workflow:ProtoWorkflow={
            events:[],
            workers:[],
            actions,
            expressions,
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

