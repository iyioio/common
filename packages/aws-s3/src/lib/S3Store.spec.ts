import { useTempCognitoUser, _allIssuedCognitoCreds } from "@iyio/aws-credential-providers";
import { cf, DependencyContainer, EnvConfig, registerConfig, shortUuid, uuid } from "@iyio/common";
import { S3Store } from './S3Store';

describe('S3Store', () => {

    const putGetDeleteAsync=async (deps:DependencyContainer, onStore?:(store:S3Store)=>void)=>{

        const config=S3Store.clientConfigFromDeps(deps)
        const store=new S3Store(config,{
            bucket:cf(deps).require('TEST_BUCKET_NAME')
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

        return {store,config};
    }

    it('should put, get and delete', async () => {

        const deps=new DependencyContainer();
        registerConfig(deps,new EnvConfig());

        await putGetDeleteAsync(deps);

    });

    it('should put, get and delete with cognito user',async ()=>{

        const deps=new DependencyContainer();
        registerConfig(deps,new EnvConfig());

        await useTempCognitoUser(deps,async ()=>{

            const {config}=await putGetDeleteAsync(deps);

            expect(_allIssuedCognitoCreds.includes(config.credentials as any)).toBe(true);

        })
    });
});
