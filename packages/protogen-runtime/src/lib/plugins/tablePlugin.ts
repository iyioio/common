import { ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { generateProtoTable } from "../protogen-table-generator.js";
import { SharedTsPluginConfigScheme } from "../sharedTsConfig.js";
import { tableCdkTemplate } from "./tableCdkTemplate.js";

const TablePluginConfig=z.object(
{
    tablePath:z.string().optional(),

    /**
     * @default "tables.ts"
     */
    tableFilename:z.string().optional(),

    /**
     * @default "tables-index.ts"
     */
    tableIndexFilename:z.string().optional(),


    /**
     * @default "tables"
     */
    tablePackage:z.string().optional(),

    /**
     * If true the tableIdParam of generated tables will be populated and a table-params file will be generated.
     */
    tableUseParamIds:z.boolean().optional(),

    /**
     * @default '@iyio/common'
     */
    dataTableDescriptionPackage:z.string().optional(),

    /**
     * @default 'allTables'
     */
    allTableArrayName:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the
     * tables
     */
    tableCdkConstructFile:z.string().optional(),

    /**
     * @default "Tbls"
     */
    tableCdkConstructClassName:z.string().optional(),



}).merge(SharedTsPluginConfigScheme);

export const tablePlugin:ProtoPipelineConfigurablePlugin<typeof TablePluginConfig>=
{
    configScheme:TablePluginConfig,

    generate:async (context,{
        tablePath,
        tablePackage='tables',
        tableFilename='tables.ts',
        tableIndexFilename='tables-index.ts',
        tableUseParamIds,
        dataTableDescriptionPackage='@iyio/common',
        allTableArrayName='allTables',
        tableCdkConstructClassName='Tbls',
        tableCdkConstructFile=context.libStyle==='nx'?`packages/cdk/src/${tableCdkConstructClassName}.ts`:undefined,
        ...tsConfig
    })=>{

        const result=await generateProtoTable(context,{
            pluginName:'tablePlugin',
            supportedTypes:['table'],
            tablePath,
            tablePackage,
            tableFilename,
            tableIndexFilename,
            tableUseParamIds,
            dataTableDescriptionPackage,
            allTableArrayName,
            ...tsConfig
        })

        if(!result){
            return;
        }

        if(tableCdkConstructFile && tableCdkConstructClassName){
            context.outputs.push({
                path:tableCdkConstructFile,
                content:tableCdkTemplate(tableCdkConstructClassName,result.tableInfos,context.importMap)
            })
        }
    }
}
