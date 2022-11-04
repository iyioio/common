import { useTempCognitoUser, _allIssuedCognitoCreds } from "@iyio/aws-credential-providers";
import { createScope, EnvValueProvider, Scope, shortUuid, uuid } from "@iyio/common";
import { S3Store } from './S3Store';

describe('S3Store', () => {

    const putGetDeleteAsync=async (scope:Scope, onStore?:(store:S3Store)=>void)=>{

        const store=S3Store.fromScope(scope,{
            bucket:scope.requireParam('TEST_BUCKET_NAME')
        });

        onStore?.(store);

        const key=shortUuid();
        const value={
            id:shortUuid(),
            name:uuid(),
        }

        console.log(`put ${key}`);
        const putR=await store.putAsync(key,value);
        expect(putR).toEqual(value);


        console.log(`get ${key}`);
        const getR=await store.getAsync(key);
        expect(getR).toEqual(value);


        console.log(`delete ${key}`);
        await store.deleteAsync(key);


        console.log(`check ${key}`);
        const get2R=await store.getAsync(key);
        expect(get2R).toBeUndefined();

        return {store,config:store.clientConfig};
    }

    it('should put, get and delete', async () => {

        const scope=createScope();
        scope.provideParams(new EnvValueProvider());

        await putGetDeleteAsync(scope);

    });

    it('should put, get and delete with cognito user',async ()=>{

        const scope=createScope();
        scope.provideParams(new EnvValueProvider());

        await useTempCognitoUser(scope,async ()=>{

            const {config}=await putGetDeleteAsync(scope);

            expect(_allIssuedCognitoCreds.includes(config.credentials as any)).toBe(true);

        })
    });
});
