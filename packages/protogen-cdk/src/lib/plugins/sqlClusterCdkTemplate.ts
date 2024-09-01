import { SqlClusterBuilderCluster } from "@iyio/cdk-common";

export interface TableNameParamNamePair
{
    name:string;
    paramName:string;
}

export interface SqlClusterCdkTemplateOptions
{
    namespace:string;
    clusters:(Omit<SqlClusterBuilderCluster,'migrations'> & {migrations?:string})[];
    constructName:string;
    sqlMigrationsPackage:string;
}

export const sqlClusterCdkTemplate=({
    namespace,
    clusters,
    constructName,
    sqlMigrationsPackage,
}:SqlClusterCdkTemplateOptions)=>{

    const imports:string[]=[];
    for(let i=0;i<clusters.length;i++){
        const c=clusters[i];
        if(c?.migrations){
            imports.push(`${c.migrations} as _migrations${i}`);
        }
    }

    const importMigrations=imports.length?`import { ${imports.join(', ')} } from "@${namespace}/${sqlMigrationsPackage}";\n`:'';

    return `${importMigrations}import { SqlClusterBuilder, SqlClusterBuilderCluster, SqlClusterBuilderOptions } from "@iyio/cdk-common";
import { Construct } from "constructs";


export class ${constructName} extends SqlClusterBuilder
{
    public constructor(scope:Construct,id:string,options:Omit<SqlClusterBuilderOptions,'clusters'>)
    {
        super(scope,id,{...options,clusters});
    }
}

const clusters:SqlClusterBuilderCluster[]=[${clusters.map((c,i)=>`
    {
        ...${JSON.stringify(c)},
        defaultDatabaseName:process.env['DATABASE_NAME_OVERRIDE']||${JSON.stringify(c.defaultDatabaseName??null)},${c.migrations?`
        clusterIdentifier:process.env['DATABASE_CLUSTER_ID'],
        secretArn:process.env['DATABASE_SECRET_ARN'],
        migrations:_migrations${i}`:''}
    }`).join(',')}
]


`
}



