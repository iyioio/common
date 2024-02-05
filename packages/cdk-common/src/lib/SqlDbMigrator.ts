import { SqlMigration } from '@iyio/common';
import { CustomResource, Duration, Stack } from 'aws-cdk-lib';
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { NodeFn } from './NodeFn';


export interface SqlDbMigratorOptions {

    /**
     * Arn to RDS cluster to connect to
     */
    clusterArn:string;

    /**
     * Arn of secret containing user credentials to connect to cluster with.
     */
    secretArn:string;

    /**
     * Name of database to use
     */
    databaseName:string;

    /**
     * All migrations
     */
    migrations:SqlMigration[];

    /**
     * The migration to migrate to. If undefined the newest migration will be migrated to.
     */
    targetMigration?:string;

    /**
     * CAUTION!! Setting to true can result in the lost all data created by migrations.
     * If true all migration downgrades will be forcefully ran.
     */
    clearOnDelete?:boolean;

    /**
     * CAUTION!! Enabling this option will result in the lost all data created by migrations.
     * If enabled all migration downgrades will be forcefully ran before applying migrations. This
     * will result in a full reset of the database each time the deployment is ran.
     */
    FORCE_RESET_DATABASE_BEFORE_MIGRATING?:'THEN_MIGRATE'|'AND_LEAVE_EMPTY';

    rdsVersion?:string;
}

export class SqlDbMigrator extends Construct{

    public readonly handlerFunc:NodeFn;

    constructor(scope: Construct, id: string, {
        migrations,
        targetMigration,
        clusterArn,
        secretArn,
        databaseName,
        clearOnDelete,
        rdsVersion,
        FORCE_RESET_DATABASE_BEFORE_MIGRATING
    }:SqlDbMigratorOptions){

        super(scope,id);

        const provider=SqlDbMigratorFunctionProvider.getOrCreate(this);

        this.handlerFunc=provider.func;

        new CustomResource(this, 'SqlDbMigratorCustomResource', {
            serviceToken:provider.provider.serviceToken,
            resourceType:'Custom::SqlDbMigrator',
            properties:{
                migrations,
                targetMigration,
                clusterArn,
                secretArn,
                databaseName,
                clearOnDelete,
                rdsVersion,
                FORCE_RESET_DATABASE_BEFORE_MIGRATING
            },
        });
    }
}

class SqlDbMigratorFunctionProvider extends Construct
{

    public static getOrCreate(scope:Construct):SqlDbMigratorFunctionProvider
    {
        const id='SqlDbMigratorFunctionProvider';
        const stack=Stack.of(scope);
        return (
            stack.node.tryFindChild(id) as SqlDbMigratorFunctionProvider ??
            new SqlDbMigratorFunctionProvider(stack,'SqlDbMigratorFunctionProvider')
        )
    }

    public readonly provider: cr.Provider;
    public readonly func:NodeFn;
    private constructor(scope:Construct,id: string)
    {
        super(scope,id);
        this.func=new NodeFn(this,'SqlDbMigratorFn',{
            timeout:Duration.minutes(15),
            memorySize:1024,
            bundledHandlerFileNames:[
                '../../dist/packages/iyio-util-fns/handlers/SqlDbMigratorFn',
                '../../node_modules/@iyio/iyio-util-fns/handlers/SqlDbMigratorFn',
            ]
        });

        this.provider=new cr.Provider(this,'SqlDbMigratorFunctionProviderHandler', {
            onEventHandler:this.func.func
        });
    }
}
