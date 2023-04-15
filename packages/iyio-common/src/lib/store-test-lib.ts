import { delayAsync } from './common-lib';
import { HashMap } from "./common-types";
import { deepCompare } from './object';
import { StoreRoute } from "./RouterStore";
import { defineBoolParam } from './scope-lib';
import { Scope } from './scope-types';
import { IStore } from './store-types';
import { storeRoot } from './store.deps';
import { shortUuid, uuid } from "./uuid";

const keepTestStoreItemsParam=defineBoolParam('keepTestStoreItems',false);

export interface TestStoreItem
{
    id:string;
    stringValue?:string;
    numberValue?:number;
    data?:HashMap;
}

export const randomName=()=>'name-'+uuid();

export const generateRandomTestStoreItem=():TestStoreItem=>({
    id:uuid(),
    stringValue:randomName(),
    numberValue:Math.round(Math.random()*100),
    data:{
        ok:randomName(),
        noWay:randomName()
    }
})

/**
 * Tests get, put and delete at the given base path
 */
export const testMountedStoreAsync=async (scope:Scope,basePath:string,route:StoreRoute)=>{

    const root=storeRoot(scope);

    root.mountRoute(route);

    const sourceItem=generateRandomTestStoreItem();

    if(basePath.endsWith('/')){
        basePath=basePath.substring(0,basePath.length-1);
    }

    const missingKey=`${uuid()}/${sourceItem.id}`;
    const realKey=`${basePath}/${sourceItem.id}`;

    let item=await root.getAsync<TestStoreItem>(missingKey);

    if(item!==undefined){
        throw new Error(`An item should have not been returned for missing key - ${missingKey}`);
    }

    item=await root.getAsync<TestStoreItem>(realKey);
    if(item!==undefined){
        throw new Error(`An item should not exists at ${realKey} yet`);
    }

    await root.putAsync(realKey,sourceItem);
    item=await root.getAsync<TestStoreItem>(realKey);
    if(!deepCompare(sourceItem,item)){
        throw new Error('Returned item should be the same as source item - '+JSON.stringify({sourceItem,item},null,4))
    }

    if(keepTestStoreItemsParam(scope)){
        console.warn(`!!!!!!. Keeping test items in store. key = ${realKey}`,item,sourceItem)
    }else{
        await root.deleteAsync(realKey);
        item=await root.getAsync<TestStoreItem>(realKey);
        if(item!==undefined){
            throw new Error(`Item at ${realKey} should have been deleted`);
        }
    }

}



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

interface ExpectMethods
{
    toEqual(value:any):void;
    toBeUndefined():void;
    toBe(value:any):void;
    toBeTruthy():void;
}
const expect=(value:any):ExpectMethods=>{
    return {
        toEqual(v:any){
            if(!deepCompare(value,v)){
                throw new Error('values not equal \n'+JSON.stringify({expected:v,received:value},null,4))
            }
        },
        toBeUndefined(){
            if(value!==undefined){
                throw new Error('value expected to be undefined  \n'+JSON.stringify({received:value},null,4))
            }
        },
        toBe(v:any){
            if(v!==value){
                throw new Error('values not equal \n'+JSON.stringify({expected:v,received:value},null,4))
            }
        },
        toBeTruthy(){
            if(!value){
                throw new Error('value expected to be truthy \n'+JSON.stringify({received:value},null,4))
            }
        },
    }
}

export const testStorePutGetDeleteAsync=async (mouthPath:string,store:IStore& Required<Pick<IStore,
    'getAsync'|'putAsync'|'deleteAsync'>>)=>
{
    try{
        const frank=createFrank();

        const key=mouthPath+frankKey;

        await store.putAsync(key,frank);
        expect(await store.getAsync(key)).toEqual(frank);

        await store.deleteAsync(key);
        expect(await store.getAsync(key)).toBeUndefined();
    }finally{
        store.dispose?.();
    }
}

export const testStoreWatchAsync=async (mouthPath:string,store:IStore & Required<Pick<IStore,
    'watch'|'getWatchCount'|'putAsync'|'deleteAsync'>>,opDelay=0)=>
{

    const delay=async ()=>{
        if(opDelay>0){
            await delayAsync(opDelay)
        }
    }
    try{
        expect(store.getWatchCount()).toBe(0);

        const frank=createFrank();
        const key=mouthPath+frankKey;

        const pointer=store.watch(key);
        let subValue:Person|undefined;
        const unsub=pointer?.subject.subscribe((v)=>{
            subValue=v;
        })
        await delay();
        expect(pointer).toBeTruthy();
        expect(pointer?.value).toBeUndefined();
        expect(subValue).toBeUndefined();
        expect(store.getWatchCount()).toBe(1);


        await store.putAsync(key,frank);
        await delay();
        expect(pointer?.value).toEqual(frank);
        expect(subValue).toEqual(frank);

        const pointer2=store.watch(key);
        await delay();
        expect(pointer2).toBeTruthy();
        expect(pointer2?.value).toEqual(frank);
        expect(store.getWatchCount()).toBe(1);

        const bob:Person={
            id:shortUuid(),
            name:'Bob'
        }
        await store.putAsync(key,bob);
        await delay();
        expect(pointer?.value).toEqual(bob);
        expect(subValue).toEqual(bob);

        await store.deleteAsync(key);
        await delay();
        expect(pointer?.value).toBeUndefined();
        expect(subValue).toBeUndefined();

        unsub?.unsubscribe();

        pointer?.dispose();
        await delay();
        expect(store.getWatchCount()).toBe(1);
        pointer2?.dispose();
        await delay();
        expect(store.getWatchCount()).toBe(0);
    }finally{
        store.dispose?.();
    }
}
