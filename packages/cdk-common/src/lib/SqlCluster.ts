import { rdsClusterArnParam, rdsDatabaseParam, rdsSecretArnParam } from "@iyio/aws-rds";
import { SqlMigration } from "@iyio/common";
import * as cdk from "aws-cdk-lib";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { ManagedProps } from "./ManagedProps";
import { SqlDbMigrator, SqlDbMigratorOptions } from "./SqlDbMigrator";

export interface SqlClusterOptions
{
    managed?:ManagedProps;
    vpc:ec2.IVpc;
    defaultDatabaseName?:string;
    minCapacity?:number,
    maxCapacity?:number,
    autoPauseMinutes?:number|null;
    migrations?:SqlMigration[];
    migratorOptions?:Partial<SqlDbMigratorOptions>;
}

export class SqlCluster extends Construct{

    public constructor(scope:Construct,id:string,{
        vpc,
        defaultDatabaseName,
        minCapacity=2,
        maxCapacity=2,
        autoPauseMinutes=5,
        migrations,
        migratorOptions,
        managed:{
            params
        }={}
    }:SqlClusterOptions){

        super(scope,id);

        const dbCluster=new rds.ServerlessCluster(this,'Rds',{
            engine:rds.DatabaseClusterEngine.auroraPostgres({version:rds.AuroraPostgresEngineVersion.VER_11_13 }),
            enableDataApi:true,
            defaultDatabaseName,
            scaling:{
                minCapacity,
                maxCapacity,
                autoPause:cdk.Duration.minutes(autoPauseMinutes??0)
            },
            vpc,
        });

        const rdsAdminCredentialsArn=dbCluster.secret?.secretArn;
        if(!rdsAdminCredentialsArn){
            throw new Error(`RDS full secret ARN is available. ${dbCluster.secret?'Has Secret':'NO secret'}`);
        }

        if(migrations && defaultDatabaseName){
            const migrator=new SqlDbMigrator(this,'Migrator',{
                migrations,
                clusterArn:dbCluster.clusterArn,
                secretArn:rdsAdminCredentialsArn,
                databaseName:defaultDatabaseName,
                ...migratorOptions
            })

            dbCluster.grantDataApiAccess(migrator.handlerFunc.func);
        }

        if(params){
            if(defaultDatabaseName){
                params.setParam(rdsDatabaseParam,defaultDatabaseName);
            }
            params.setParam(rdsClusterArnParam,dbCluster.clusterArn);
            params.setParam(rdsSecretArnParam,rdsAdminCredentialsArn);
        }

    }
}
