import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { HashMap } from "./common-types";
import { deepCompare } from './object';
import { StoreRoute } from "./RouterStore";
import { defineBoolParam } from './scope-lib';
import { Scope } from './scope-types';
import { uuid } from "./uuid";
import { storeRoot } from './_types.common';

const keepTestStoreItemsParam=defineBoolParam('keepTestStoreItems',false);

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
