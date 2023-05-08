import { joinPaths } from "@iyio/common";
import { ProtoAction, ProtoExpression, ProtoPipelineConfigurablePlugin, ProtoWorkflow, getProtoPluginPackAndPath, parseProtoAction, parseProtoExpression, protoGenerateTsIndex } from "@iyio/protogen";
import { z } from "zod";

export const pwActionDataOutputKey='PwWorkflow'

const supportedTypes=['action','expression'];

const ActionPluginConfig=z.object(
{
    /**
     * @default .pwActionPackage
     */
    pwActionPath:z.string().optional(),

    /**
     * @default "pwActions"
     */
    pwActionPackage:z.string().optional(),

    /**
     * @default "pwActions"
     */
    pwActionExportName:z.string().optional(),

    /**
     * @default "pwActions-index.ts"
     */
    pwActionIndexFilename:z.string().optional(),
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
    },{
        pwActionPackage='pwActions',
        pwActionPath=pwActionPackage,
        pwActionExportName='pwActions',
        pwActionIndexFilename='pwActions-index.ts',
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            pwActionPackage,
            pwActionPath,
            libStyle,
            {packagePaths,indexFilename:pwActionIndexFilename}
        );



        const out:string[]=[];
        importMap[pwActionExportName]=packageName;

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

        dataOutputs[pwActionDataOutputKey]=workflow;

        out.push(`export const ${pwActionExportName}:ProtoWorkflow=`+JSON.stringify(workflow,null,tab.length));

        outputs.push({
            path:joinPaths(path,'actions.ts'),
            content:out.join('\n')
        })

        // add index file
        outputs.push({
            path:joinPaths(path,pwActionIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })
    }
}

