import { JsonMemoryStore } from './JsonStore';
import { MemoryStore } from './MemoryStore';
import { RouterStore } from './RouterStore';
import { createScope } from './scope-lib';
import { testMountedStoreAsync } from './store-test-lib';
import { IStore } from './store-types';
import { shortUuid, uuid } from './uuid';

interface Person
{
    id:string;
    name:string;
}

const frankKey='/people/frank';
const createFrank=():Person=>({
    id:shortUuid(),
    name:'Frank'
})

const putGetDeleteAsync=async (mouthPath:string,store:IStore& Required<Pick<IStore,
    'getAsync'|'putAsync'|'deleteAsync'>>)=>
{
    const frank=createFrank();

    const key=mouthPath+frankKey;

    await store.putAsync(key,frank);
    expect(await store.getAsync(key)).toEqual(frank);

    await store.deleteAsync(key);
    expect(await store.getAsync(key)).toBeUndefined();
}

const watchAsync=async (mouthPath:string,store:IStore & Required<Pick<IStore,
    'watch'|'getWatchCount'|'putAsync'|'deleteAsync'>>)=>
{

    expect(store.getWatchCount()).toBe(0);

    const frank=createFrank();
    const key=mouthPath+frankKey;

    const pointer=store.watch(key);
    let subValue:Person|undefined;
    const unsub=pointer?.subject.subscribe((v)=>{
        subValue=v;
    })
    expect(pointer).toBeTruthy();
    expect(pointer?.value).toBeUndefined();
    expect(subValue).toBeUndefined();
    expect(store.getWatchCount()).toBe(1);


    await store.putAsync(key,frank);
    expect(pointer?.value).toEqual(frank);
    expect(subValue).toEqual(frank);

    const pointer2=store.watch(key);
    expect(pointer2).toBeTruthy();
    expect(pointer2?.value).toEqual(frank);
    expect(store.getWatchCount()).toBe(1);

    const bob:Person={
        id:shortUuid(),
        name:'Bob'
    }
    await store.putAsync(key,bob);
    expect(pointer?.value).toEqual(bob);
    expect(subValue).toEqual(bob);

    await store.deleteAsync(key);
    expect(pointer?.value).toBeUndefined();
    expect(subValue).toBeUndefined();

    unsub?.unsubscribe();

    pointer?.dispose();
    expect(store.getWatchCount()).toBe(1);
    pointer2?.dispose();
    expect(store.getWatchCount()).toBe(0);
}

const createMemoryStore=()=>new MemoryStore<Person>({cloneValues:true});

const createRouterStore=(mountPath:string)=>{

    const scope=createScope();
    const store=new RouterStore(scope);

    store.mount(mountPath,createMemoryStore);

    return store;
}

describe('MemoryStore',()=>{

    it('should put, get, delete',async ()=>{
        await putGetDeleteAsync('/',createMemoryStore());
    });

    it('should watch',async ()=>{
        await watchAsync('/',createMemoryStore());
    });

    it('should meet standard mount operations',async ()=>{

        const scope=createScope();

        const basePath='tmp-memory/items/test-stuff'
        await testMountedStoreAsync(scope,basePath,{
            path:basePath,
            store:new MemoryStore({cloneValues:true})
        })
    })

});

describe('JsonMemoryStore',()=>{

    it('should put, get, delete',async ()=>{
        await putGetDeleteAsync('/',new JsonMemoryStore());
    });

    it('should watch',async ()=>{
        await watchAsync('/',new JsonMemoryStore());
    });

    it('should meet standard mount operations',async ()=>{

        const scope=createScope();

        const basePath='tmp-memory/items/test-stuff'
        await testMountedStoreAsync(scope,basePath,{
            path:basePath,
            store:new JsonMemoryStore()
        })
    })

});

describe('RouterStore',()=>{

    const mountPath='/';

    it('should put, get, delete',async ()=>{
        await putGetDeleteAsync(mountPath,createRouterStore(mountPath));
    });

    it('should watch',async ()=>{
        await watchAsync(mountPath,createRouterStore(mountPath));
    });

})

describe('RouterStore with mount path',()=>{

    const mountPath='/apps/'+uuid();

    it('should put, get, delete',async ()=>{
        await putGetDeleteAsync(mountPath,createRouterStore(mountPath));
    });

    it('should watch',async ()=>{
        await watchAsync(mountPath,createRouterStore(mountPath));
    });

})
