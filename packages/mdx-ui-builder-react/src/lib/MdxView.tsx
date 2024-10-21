import { BaseLayoutProps } from "@iyio/common";
import { MdxUiComponentCache, getDefaultMdxUiComponentCache } from "@iyio/mdx-ui-builder";
import { VfsItem } from "@iyio/vfs";
import { useVfsString } from "@iyio/vfs-react";
import { useEffect, useState } from "react";
import { MdxUiBuilderView, MdxUiBuilderViewProps } from "./MdxUiBuilderView";

export interface MdxViewProps extends MdxUiBuilderViewProps
{
    file?:VfsItem;
    path?:string;
    cache?:MdxUiComponentCache|boolean;
    cacheKey?:string;
    cacheTtl?:number;
    disableCacheWrite?:boolean;
}

export function MdxView({
    file,
    path=file?.path,
    code:codeProp,
    disableHighlighting=true,
    cache,
    cacheKey,
    cacheTtl,
    builderOptions,
    disableCacheWrite,
    ...props
}:MdxViewProps & BaseLayoutProps){

    if(cache && path && !cacheKey){
        cacheKey=path;
    }

    if(cacheKey && cache===true){
        cache=getDefaultMdxUiComponentCache();
    }

    if(typeof cache === 'boolean'){
        cache=undefined;
    }

    const [cachedMissed,setCachedMissed]=useState(false);
    const disableLoad=(cache && !cachedMissed);
    if(disableLoad){
        path=undefined;
    }

    const _code=useVfsString(codeProp===undefined?path:undefined);
    const code=codeProp??_code;

    useEffect(()=>{
        if(!cache || (typeof cache === 'boolean')){
            return;
        }
        const sub=cache.onEventCacheMiss.subscribe(evt=>{
            if(evt.type==='async'){
                setCachedMissed(true);
            }
        })
        return ()=>{
            sub.unsubscribe();
        }
    },[cache]);


    return (
        <MdxUiBuilderView
            code={code??undefined}
            disableHighlighting={disableHighlighting}
            builderOptions={{
                cache,
                cacheKey,
                cacheTtl,
                disableCacheWrite,
                ...builderOptions,
                compilerOptions:{
                    sourceMap:false,
                    ...builderOptions?.compilerOptions,
                }
            }}
            {...props}
        />
    )

}

