import { rdsClusterArnParam, rdsDatabaseParam, rdsSecretArnParam, rdsVersionParam } from "@iyio/aws-rds";
import { SqlMigration } from "@iyio/common";
import * as cdk from "aws-cdk-lib";
import { ArnFormat } from "aws-cdk-lib";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from "aws-cdk-lib/aws-iam";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ManagedProps, getDefaultManagedProps } from "./ManagedProps";
import { SqlDbMigrator, SqlDbMigratorOptions } from "./SqlDbMigrator";
import { AccessGranter, IAccessGrantGroup } from "./cdk-types";

const DATA_API_ACTIONS = [
    'rds-data:BatchExecuteStatement',
    'rds-data:BeginTransaction',
    'rds-data:CommitTransaction',
    'rds-data:ExecuteStatement',
    'rds-data:RollbackTransaction',
];

export interface SqlClusterOptionsBase
{
    defaultDatabaseName?:string;
    minCapacity?:number,
    maxCapacity?:number,
    autoPauseMinutes?:number|null;
    migrations?:SqlMigration[];
    migratorOptions?:Partial<SqlDbMigratorOptions>;
    rdsVersion?:1|2|'by-id';
    version?:string;
    /**
     * The id of an existing cluster to attach to instead of creating new.
     */
    clusterIdentifier?:string;
    secretArn?:string;
}

export interface SqlClusterOptions extends SqlClusterOptionsBase
{
    managed?:ManagedProps;
    vpc:ec2.IVpc;
}

export class SqlCluster extends Construct implements IAccessGrantGroup{

    public readonly accessGrants:AccessGranter[]=[];

    public constructor(scope:Construct,id:string,{
        vpc,
        defaultDatabaseName,
        clusterIdentifier,
        rdsVersion=1,
        minCapacity=rdsVersion===2?0.5:2,
        maxCapacity=2,
        autoPauseMinutes=5,
        migrations,
        migratorOptions,
        version,
        secretArn,
        managed:{
            params,
            accessManager,
            resources,
        }=getDefaultManagedProps()
    }:SqlClusterOptions){

        super(scope,id);

        if(clusterIdentifier){
            rdsVersion='by-id';
        }

        const postgresVersion=version?
            (rds.AuroraPostgresEngineVersion as any)['VER_'+version.replace(/\D/g,'_')]:
            rds.AuroraPostgresEngineVersion.VER_11_13;

        if(!postgresVersion){
            throw new Error(`Invalid version - ${version}`)
        }

        const dbClusterV1=rdsVersion!==1?null:new rds.ServerlessCluster(this,'Rds',{
            engine:rds.DatabaseClusterEngine.auroraPostgres({version:postgresVersion}),
            enableDataApi:true,//*** */
            defaultDatabaseName,
            scaling:{
                minCapacity,
                maxCapacity,
                autoPause:cdk.Duration.minutes(autoPauseMinutes??0)
            },
            vpc,
        })

        const dbClusterV2=rdsVersion!==2?null:new rds.DatabaseCluster(this,'Rds',{
            engine:rds.DatabaseClusterEngine.auroraPostgres({version:postgresVersion}),
            defaultDatabaseName,
            serverlessV2MinCapacity:minCapacity,
            serverlessV2MaxCapacity:maxCapacity,
            readers:[
                rds.ClusterInstance.serverlessV2('reader1',{scaleWithWriter:true}),
                rds.ClusterInstance.serverlessV2('reader2'),
            ],
            writer:rds.ClusterInstance.serverlessV2('writer1'),
            vpc,
        });

        const existingCluster=rdsVersion!=='by-id'?null:rds.DatabaseCluster.fromDatabaseClusterAttributes(this,'Rds',{
            clusterIdentifier:clusterIdentifier??'no-arn',
            engine:rds.DatabaseClusterEngine.auroraPostgres({version:postgresVersion}),
        })

        const cluster=dbClusterV1??dbClusterV2;
        const secret=secretArn?(secrets.Secret.fromSecretCompleteArn(this,'ImportedSecret',secretArn)):cluster?.secret;
        if(!secret){
            throw new Error('Cluster secret not found');
        }

        const rdsAdminCredentialsArn=secret.secretArn;

        let grantDataApiAccess:((grantee: iam.IGrantable)=>void)|undefined;
        let arn:string|undefined;
        if(dbClusterV1){
            arn=dbClusterV1.clusterArn;
            grantDataApiAccess=(g)=>dbClusterV1.grantDataApiAccess(g);
        }else if(dbClusterV2){
            const cfnCluster=dbClusterV2.node.defaultChild as rds.CfnDBCluster;
            cfnCluster.addPropertyOverride("EnableHttpEndpoint",true);
            arn=cdk.Stack.of(this).formatArn({
                service:'rds',
                resource:'cluster',
                arnFormat:ArnFormat.COLON_RESOURCE_NAME,
                resourceName:dbClusterV2.clusterIdentifier,
            });
            grantDataApiAccess=g=>{
                iam.Grant.addToPrincipal({
                    grantee:g,
                    actions:DATA_API_ACTIONS,
                    resourceArns:['*'],
                    scope:dbClusterV2,
                });
                secret.grantRead(g);
            }
        }else if(existingCluster){
            rdsVersion=2;
            arn=cdk.Stack.of(this).formatArn({
                service:'rds',
                resource:'cluster',
                arnFormat:ArnFormat.COLON_RESOURCE_NAME,
                resourceName:existingCluster.clusterIdentifier,
            });
            grantDataApiAccess=g=>{
                iam.Grant.addToPrincipal({
                    grantee:g,
                    actions:DATA_API_ACTIONS,
                    resourceArns:['*'],
                    scope:existingCluster,
                });
                secret.grantRead(g);
            }
        }

        if(!arn){
            throw new Error('Unable to get arn of db cluster');
        }
        if(!grantDataApiAccess){
            throw new Error('grantDataApiAccess for cluster not set')
        }

        if(migrations && defaultDatabaseName){
            const migrator=new SqlDbMigrator(this,'Migrator',{
                migrations,
                clusterArn:arn,
                secretArn:rdsAdminCredentialsArn,
                databaseName:defaultDatabaseName,
                rdsVersion:rdsVersion!==1?rdsVersion.toString():undefined,
                ...migratorOptions
            })

            grantDataApiAccess(migrator.handlerFunc.func);
        }

        if(params){
            if(defaultDatabaseName){
                params.setParam(rdsDatabaseParam,defaultDatabaseName);
            }
            params.setParam(rdsClusterArnParam,arn);
            params.setParam(rdsSecretArnParam,rdsAdminCredentialsArn);
            if(rdsVersion!==1){
                params.setParam(rdsVersionParam,rdsVersion.toString());
            }
        }

        this.accessGrants.push({
            grantName:id,
            grant:request=>{
                if(request.types?.includes('query')){
                    grantDataApiAccess?.(request.grantee);
                }
            }
        })

        resources.push({name:id,sqlCluster:this})

        if(accessManager){
            accessManager.addGrantGroup(this);
        }

    }
}
