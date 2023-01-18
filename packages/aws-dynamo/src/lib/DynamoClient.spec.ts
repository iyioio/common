import { useTempCognitoUser } from "@iyio/aws-credential-providers";
import { createScope, EnvParams, generateRandomTestStoreItem, parseConfigBool, Scope, shortUuid, testMountedStoreAsync } from "@iyio/common";
import { testDynamoDbTable } from './dynamo-test-lib';
import { DynamoClient } from './DynamoClient';




describe('DynamoStore', () => {

    if(!parseConfigBool(process.env['NX_RUN_LONG_RUNNING_TEST'])){
        it('should skip dynamo tests',()=>{
            // do nothing
        })
        return;
    }

    const putGetDeleteAsync=async (scope:Scope, onStore?:(store:DynamoClient)=>void)=>{

        const store=DynamoClient.fromScope(scope);

        const tableName=testDynamoDbTable(scope);

        onStore?.(store);

        const key=shortUuid();
        const item=generateRandomTestStoreItem();

        console.log(`put ${key}`);
        await store.putAsync(tableName,'id',item);


        console.log(`get ${key}`);
        const getR=await store.getAsync(tableName,{id:item.id});
        expect(getR).toEqual(item);


        console.log(`delete ${key}`);
        await store.deleteAsync(tableName,{id:item.id});


        console.log(`check ${key}`);
        const get2R=await store.getAsync(tableName,{id:item.id});
        expect(get2R).toBeUndefined();

        return {store,config:store.clientConfig};
    }

    it('should put, get and delete', async () => {

        const scope=createScope(reg=>{
            reg.addParams(new EnvParams());
        });

        const {store}=await putGetDeleteAsync(scope);

        expect((await store.getClient().config.credentials()).sessionToken).toBeUndefined();

    });

    it('should put, get and delete with cognito user',async ()=>{

        await useTempCognitoUser(reg=>{
            reg.addParams(new EnvParams());
        },async scope=>{

            const {store}=await putGetDeleteAsync(scope);

            expect((await store.getClient().config.credentials()).sessionToken).toBeTruthy();

        })
    });



    it('should meet standard mount operations',async ()=>{
         await useTempCognitoUser(reg=>{
            reg.addParams(new EnvParams());
        },async scope=>{
            const basePath='dynamo/test-items';
            const tableName=testDynamoDbTable(scope);
            await testMountedStoreAsync(scope,basePath,{
                    path:basePath,
                    store:DynamoClient.fromScope(scope,{
                        tableName
                    }).getStoreAdapter()
            })

        })
    })
});
