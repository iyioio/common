import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { HashMap } from "./common-types";
import { deepCompare } from './object';
import { StoreRoute } from "./RouterStore";
import { Scope } from './scope-types';
import { uuid } from "./uuid";
import { storeService } from './_types.common';

export interface TestStoreItem
{
    id:string;
    stringValue?:string;
    numberValue?:number;
    data?:HashMap;
}

export const randomName=()=>uniqueNamesGenerator({
  dictionaries: [adjectives, colors, animals]
});

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

    const rootStore=storeService(scope);

    rootStore.mountRoute(route);

    const sourceItem=generateRandomTestStoreItem();

    if(basePath.endsWith('/')){
        basePath=basePath.substring(0,basePath.length-1);
    }

    const missingKey=`${uuid()}/${sourceItem.id}`;
    const realKey=`${basePath}/${sourceItem.id}`;

    let item=await rootStore.getAsync<TestStoreItem>(missingKey);

    if(item!==undefined){
        throw new Error(`An item should have not been returned for missing key - ${missingKey}`);
    }

    item=await rootStore.getAsync<TestStoreItem>(realKey);
    if(item!==undefined){
        throw new Error(`An item should not exists at ${realKey} yet`);
    }

    await rootStore.putAsync(realKey,sourceItem);
    item=await rootStore.getAsync<TestStoreItem>(realKey);
    if(!deepCompare(sourceItem,item)){
        throw new Error('Returned item should be the same as source item - '+JSON.stringify({sourceItem,item},null,4))
    }

    await rootStore.deleteAsync(realKey);
    item=await rootStore.getAsync<TestStoreItem>(realKey);
    if(item!==undefined){
        throw new Error(`Item at ${realKey} should have been deleted`);
    }

}
