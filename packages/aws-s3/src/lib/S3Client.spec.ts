import { useTempCognitoUser } from "@iyio/aws-credential-providers";
import { createScope, EnvParams, Scope, shortUuid, testMountedStoreAsync, uuid } from "@iyio/common";
import { S3Client } from './S3Client.js';

describe('S3Store', () => {

    const putGetDeleteAsync=async (scope:Scope, onStore?:(store:S3Client)=>void)=>{

        const store=S3Client.fromScope(scope);

        const bucket=scope.requireParam('TEST_BUCKET_NAME')

        onStore?.(store);

        const key=shortUuid();
        const value={
            id:shortUuid(),
            name:uuid(),
        }

        console.log(`put ${key}`);
        await store.putAsync(bucket,key,value);


        console.log(`get ${key}`);
        const getR=await store.getAsync(bucket,key);
        expect(getR).toEqual(value);


        console.log(`delete ${key}`);
        await store.deleteAsync(bucket,key);


        console.log(`check ${key}`);
        const get2R=await store.getAsync(bucket,key);
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
            const basePath='s3/test-items'
            await testMountedStoreAsync(scope,basePath,{
                path:basePath,
                store:S3Client.fromScope(scope,{
                    bucket:scope.requireParam('TEST_BUCKET_NAME')
                }).getStoreAdapter()
            })

        })
    })
});
