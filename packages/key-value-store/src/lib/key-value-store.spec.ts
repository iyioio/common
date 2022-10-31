import { DependencyContainer, shortUuid, uuid } from '@iyio/common';
import { IKeyValueStore } from './key-value-store-types';
import { MemoryStore } from './MemoryStory';
import { RouterStore } from './RouterStore';

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

const putGetDeleteAsync=async (mouthPath:string,store:IKeyValueStore& Required<Pick<IKeyValueStore,
    'getAsync'|'putAsync'|'deleteAsync'>>)=>
{
    const frank=createFrank();

    const key=mouthPath+frankKey;

    await store.putAsync(key,frank);
    expect(await store.getAsync(key)).toEqual(frank);

    await store.deleteAsync(key);
    expect(await store.getAsync(key)).toBeUndefined();
}

const watchAsync=async (mouthPath:string,store:IKeyValueStore & Required<Pick<IKeyValueStore,
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

    const deps=new DependencyContainer();
    const store=new RouterStore(deps);

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
