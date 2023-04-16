import { AccessRequestDescription, CommonAccessType } from "@iyio/cdk-common";
import { HashMap, joinPaths, strFirstToLower } from "@iyio/common";
import { ProtoLibStyle, ProtoParamType } from "./protogen-pipeline-types";
import { ProtoNode } from "./protogen-types";

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

        const indexFilename=libStyle==='nx'?
            `packages/${packageDirName}/src/index.ts`:
            joinPaths(r.path,packageIndex.indexFilename);

        protoAddIndexPathToPaths(r.packageName,indexFilename,packageIndex.packagePaths);

        r.indexFilename=indexFilename;
    }

    return r;

}

export const protoAddContextParam=(
    baseName:string,
    paramPackage:string,
    paramMap:Record<string,ProtoParamType>,
    importMap:Record<string,string>,
    type:ProtoParamType='string'
):string=>{
    const paramName=protoGetParamName(baseName);
    paramMap[paramName]=type;
    importMap[paramName]=paramPackage;
    return paramName;
}

export const protoGetParamName=(baseName:string)=>strFirstToLower(baseName)+'Param';

export const protoAddIndexPathToPaths=(packageName:string,indexPath:string,paths:Record<string,string[]>):string[]=>{
    let ary=paths[packageName];
    if(!ary){
        paths[packageName]=ary=[];
    }
    if(!ary.includes(indexPath)){
        ary.push(indexPath);
    }
    return ary;
}


export const protoNodeChildrenToAccessRequests=(node:ProtoNode):AccessRequestDescription[]=>{
    const requests:AccessRequestDescription[]=[];

    if(!node.children){
        return requests;
    }

    for(const c in node.children){
        const child=node.children[c];
        const types=child.name.split('-') as CommonAccessType[];
        for(const type of child.types){
            requests.push({
                grantName:type.type,
                types,
            })
        }

    }

    return requests;
}
