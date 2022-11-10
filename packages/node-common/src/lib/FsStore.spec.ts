import { createScope, testMountedStoreAsync, testStorePutGetDeleteAsync, testStoreWatchAsync } from "@iyio/common";
import { FsStore } from './FsStore';

const watchDelay=300;

const createStore=()=>new FsStore({dataDirectory:'.test-data/fs-store-data'})

describe('MemoryStore',()=>{

    it('should put, get, delete',async ()=>{
        await testStorePutGetDeleteAsync('/',createStore());
    });

    it('should watch',async ()=>{
        await testStoreWatchAsync('/',createStore(),watchDelay);
    });

    it('should meet standard mount operations',async ()=>{

        const scope=createScope();

        const basePath='tmp-memory/items/test-stuff'
        await testMountedStoreAsync(scope,basePath,{
            path:basePath,
            store:createStore()
        })
    })

});
