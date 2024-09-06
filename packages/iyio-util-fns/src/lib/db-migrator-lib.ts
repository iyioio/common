import { AwsAuthProviders, OnEventRequest, OnEventResponse } from "@iyio/aws";
import { RdsClient, applyDbMigrationAsync, forceClearAllMigrationsAsync } from "@iyio/aws-rds";
import { SqlMigration, authService, delayAsync, sql } from "@iyio/common";

const physicalResourceId='SqlDbMigration_HyEQhCoDFzbiL1tfx6UU';


export async function migrateDb(
    event: OnEventRequest
): Promise<OnEventResponse> {

    console.info('create/update',JSON.stringify(event));

    const database=event.ResourceProperties['databaseName'];

    const client=new RdsClient({
        awsAuth:AwsAuthProviders,
        clusterArn:event.ResourceProperties['clusterArn'],
        secretArn:event.ResourceProperties['secretArn'],
        database,
        region:process.env['AWS_REGION']??'',
    },authService().userDataCache,undefined,event.ResourceProperties['rdsVersion']==='2');

    client.log=true;

    while(true){
        try{
            await client.wakeDatabaseAsync();
            break;
        }catch(ex){
            console.warn('Wake DB Failed. Will try again',ex);
            await delayAsync(1000);
        }
    }

    try{

        const migrations:SqlMigration[]=event.ResourceProperties['migrations']??[];
        const targetMigration:string|undefined=event.ResourceProperties['migrations'];

        const reset=event.ResourceProperties['FORCE_RESET_DATABASE_BEFORE_MIGRATING'];
        if(reset==='AND_LEAVE_EMPTY' || reset==='THEN_MIGRATE'){
            await forceClearAllMigrationsAsync(client,migrations);
        }

        if(reset!=='AND_LEAVE_EMPTY'){
            try{
                await client.execAsync(sql`CREATE DATABASE ${{name:database}}`,undefined,undefined,{database:null});
            }catch(ex){
                console.info('DB may already exist',database,ex);
            }
            await applyDbMigrationAsync(client,migrations,targetMigration);
        }

        return {
            PhysicalResourceId:physicalResourceId
        }
    }finally{
        client.dispose();
    }

}

export async function deleteDb(event: OnEventRequest) {

    console.info('delete',event);

    if(!event.ResourceProperties['clearOnDelete']){
        return {
            PhysicalResourceId:physicalResourceId
        }
    }

    console.info('Forcefully clearing all migrations');

    const client=new RdsClient({
        awsAuth:AwsAuthProviders,
        clusterArn:event.ResourceProperties['clusterArn'],
        secretArn:event.ResourceProperties['secretArn'],
        database:event.ResourceProperties['databaseName'],
        region:process.env['AWS_REGION']??''
    },authService().userDataCache);

    client.log=true;

    await client.wakeDatabaseAsync();

    try{

        const migrations:SqlMigration[]=event.ResourceProperties['migrations']??[];

        await forceClearAllMigrationsAsync(client,migrations)

        return {
            PhysicalResourceId:physicalResourceId
        }
    }finally{
        client.dispose();
    }
}
