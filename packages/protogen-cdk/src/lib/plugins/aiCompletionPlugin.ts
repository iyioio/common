import { safeParseNumberOrUndefined } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { AiCompletionInfo, aiCompletionCdkTemplate } from "./aiCompletionCdkTemplate.js";

const supportedTypes=['aiCompletion'];

const AiCompletionPluginConfig=z.object(
{
    /**
     * @default .aiCompletionPackage
     */
    aiCompletionPath:z.string().optional(),

    /**
     * @default "fns"
     */
    aiCompletionPackage:z.string().optional(),

    /**
     * @default .aiCompletionClientPackage
     */
    aiCompletionClientPath:z.string().optional(),

    /**
     * @default "fn-clients"
     */
    aiCompletionClientPackage:z.string().optional(),

    /**
     * @default "fn-clients-index.ts"
     */
    aiCompletionClientIndexFilename:z.string().optional(),

    /**
     * @default "fn-clients.ts"
     */
    aiCompletionClientFilename:z.string().optional(),

    /**
     * @default "handler"
     */
    aiCompletionHandlerName:z.string().optional(),

    /**
     * @default "@iyio/common"
     */
    aiCompletionLibPackage:z.string().optional(),

    /**
     * @default "@iyio/aws-lambda"
     */
    aiCompletionLambdaPackage:z.string().optional(),

    aiCompletionIndexFilename:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the
     * functions
     */
    aiCompletionCdkConstructFile:z.string().optional(),

    /**
     * @default "Fns"
     */
    aiCompletionCdkConstructClassName:z.string().optional(),

    /**
     * Path where
     */
    aiCompletionDistPath:z.string().optional(),


    /**
     * If true function stub files will include a call to an init function
     * @default true
     */
    aiCompletionInit:z.boolean().optional(),
    aiCompletionInitFunction:z.string().optional(),
    aiCompletionInitFunctionPackage:z.string().optional(),

    /**
     * The default timeout for generated functions in milliseconds
     */
    aiCompletionDefaultTimeoutMs:z.number().optional(),
})

export const aiCompletionPlugin:ProtoPipelineConfigurablePlugin<typeof AiCompletionPluginConfig>=
{
    configScheme:AiCompletionPluginConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        libStyle,
    },{
        aiCompletionCdkConstructClassName='AiCompletion',
        aiCompletionCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${aiCompletionCdkConstructClassName}.ts`:undefined,
    })=>{



        const supported=nodes.filter(n=>supportedTypes.includes(n.type));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        const infos:AiCompletionInfo[]=[];


        for(const node of supported){
            infos.push({
                fnName:node.name,
                anonUsdCap:safeParseNumberOrUndefined(node.children?.['anonUsdCap']?.value),
                anonUsdCapTotal:safeParseNumberOrUndefined(node.children?.['anonUsdCapTotal']?.value),
            });
        }


        if(aiCompletionCdkConstructFile){
            outputs.push({
                path:aiCompletionCdkConstructFile,
                content:aiCompletionCdkTemplate(aiCompletionCdkConstructClassName,infos),
            })
        }

    }
}
