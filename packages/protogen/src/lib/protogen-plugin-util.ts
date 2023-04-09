import { HashMap, joinPaths } from "@iyio/common";

export interface ProtoPluginPackagePath
{
    packageName:string;
    path:string;
}

export interface ProtoIndexInfo
{
    packagePaths:HashMap<string[]>;
    indexFilename:string;
}

export const getProtoPluginPackAndPath=(
    namespace:string,
    packageName:string,
    path:string|null|undefined,
    addIndex?:ProtoIndexInfo
):ProtoPluginPackagePath=>{

    const r={
        packageName:packageName.startsWith('@')?packageName:`@${namespace}/${packageName}`,
        path:path??packageName.replace(/@/g,'').replace(/[^\w-]/g,'_')
    }

    if(addIndex){
        let ary=addIndex.packagePaths[r.packageName];
        if(!ary){
            addIndex.packagePaths[r.packageName]=ary=[];
        }
        ary.push(joinPaths(r.path,addIndex.indexFilename))
    }

    return r;

}
