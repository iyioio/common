import { HashMap, joinPaths } from "@iyio/common";
import { ProtoLibStyle } from "./protogen-pipeline-types";

export interface ProtoPluginPackagePath
{
    packageName:string;
    path:string;
}
export interface ProtoPluginPackagePathIndex extends ProtoPluginPackagePath
{
    /**
     * Full path to index file
     */
    indexFilename:string;
}

export interface ProtoPackageIndex
{
    packagePaths:HashMap<string[]>;
    indexFilename:string;
}

export interface getProtoPluginPackAndPathOverloads
{
    (
        namespace:string,
        packageName:string,
        path:string|null|undefined,
        libStyle:ProtoLibStyle
    ):ProtoPluginPackagePath;

    (
        namespace:string,
        packageName:string,
        path:string|null|undefined,
        libStyle:ProtoLibStyle,
        packageIndex:ProtoPackageIndex
    ):ProtoPluginPackagePathIndex;
}

export const getProtoPluginPackAndPath:getProtoPluginPackAndPathOverloads=(
    namespace:string,
    packageName:string,
    path:string|null|undefined,
    libStyle:ProtoLibStyle,
    packageIndex?:ProtoPackageIndex
):ProtoPluginPackagePathIndex=>{

    const packageDirName=packageName.replace(/@/g,'').replace(/[^\w-]/g,'_');

    if((!path || path===packageName) && libStyle=='nx'){
        path=`packages/${packageDirName}/src/lib`
    }

    const r={
        packageName:packageName.startsWith('@')?packageName:`@${namespace}/${packageName}`,
        path:path??packageDirName,
    } as ProtoPluginPackagePathIndex;

    if(packageIndex){
        let ary=packageIndex.packagePaths[r.packageName];
        if(!ary){
            packageIndex.packagePaths[r.packageName]=ary=[];
        }
        const indexFilename=libStyle==='nx'?
            `packages/${packageDirName}/src/index.ts`:
            joinPaths(r.path,packageIndex.indexFilename);
        ary.push(indexFilename);
        r.indexFilename=indexFilename;
    }

    return r;

}
