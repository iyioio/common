import { cf, DependencyContainer, EnvConfig, registerConfig, shortUuid, uuid } from "@iyio/common";
import { getS3ClientConfigFromDeps, S3Store } from './S3Store';

describe('S3Store', () => {

    it('should put, get and delete', async () => {

        const deps=new DependencyContainer();
        registerConfig(deps,new EnvConfig());

        const store=new S3Store(getS3ClientConfigFromDeps(deps),{
            bucket:cf(deps).require('TEST_BUCKET_NAME')
        });


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

    });
});
