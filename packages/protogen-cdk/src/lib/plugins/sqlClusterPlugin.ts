import { safeParseNumberOrUndefined } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { sqlClusterCdkTemplate } from "./sqlClusterCdkTemplate";

const supportedTypes=['sqlCluster'];

const SqlClusterConfig=z.object(
{

    /**
     * @default "SqlClusters"
     */
   sqlClusterCdkConstructClassName:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the cluster
     */
    sqlClusterCdkConstructFile:z.string().optional(),

    /**
     * @default "sql-migrations"
     */
    sqlMigrationsPackage:z.string().optional(),
})

export const sqlClusterPlugin:ProtoPipelineConfigurablePlugin<typeof SqlClusterConfig>=
{
    configScheme:SqlClusterConfig,
    generate:async ({
        outputs,
        log,
        nodes,
        libStyle,
        namespace,
    },{
        sqlClusterCdkConstructClassName='SqlClusters',
        sqlClusterCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${sqlClusterCdkConstructClassName}.ts`:undefined,
        sqlMigrationsPackage='sql-migrations'
    })=>{

        const supported=nodes.filter(n=>supportedTypes.some(t=>n.types.some(nt=>nt.type===t)));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        if(sqlClusterCdkConstructFile){
            outputs.push({
                path:sqlClusterCdkConstructFile,
                content:sqlClusterCdkTemplate({
                    namespace,
                    constructName:sqlClusterCdkConstructClassName,
                    sqlMigrationsPackage,
                    clusters:supported.map(c=>({
                        name:c.name,
                        defaultDatabaseName:c.children?.['defaultDatabaseName']?.value,
                        minCapacity:safeParseNumberOrUndefined(c.children?.['minCapacity']?.value),
                        maxCapacity:safeParseNumberOrUndefined(c.children?.['maxCapacity']?.value),
                        autoPauseMinutes:safeParseNumberOrUndefined(c.children?.['autoPauseMinutes']?.value),
                        migrations:c.children?.['migrations']?.value,
                        rdsVersion:safeParseNumberOrUndefined(c.children?.['rdsVersion']?.value) as any,
                        version:c.children?.['version']?.value,
                        envPattern:c.children?.['$envPattern']?.value,
                    }))
                })
            })
        }

    }
}
