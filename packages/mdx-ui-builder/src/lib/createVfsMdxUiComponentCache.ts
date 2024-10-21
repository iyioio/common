import { joinPaths } from "@iyio/common";
import { MdxUiCachedComponent, MdxUiCompileResult, MdxUiComponentCache, MdxUiComponentCacheMissEvt, isMdxUiCachedComponentExpired } from "@iyio/mdx-ui-builder";
import { vfs } from '@iyio/vfs';
import { Subject } from "rxjs";

const ext='.compiled.json';

export const createVfsMdxUiComponentCache=(baseDir='/component-cache'):MdxUiComponentCache=>{

    const cache:Record<string,MdxUiCachedComponent>={};
    const loadCache:Record<string,Promise<MdxUiCachedComponent|undefined>>={};

    const onEventCacheMiss=new Subject<MdxUiComponentCacheMissEvt>();

    return {
        onEventCacheMiss,
        getCompSync:(key:string,ttl?:number):MdxUiCachedComponent|undefined=>
        {
            let c=cache[key];
            c=(c && !isMdxUiCachedComponentExpired(c) && ttl && c.ttl)?(Date.now()+ttl<=c.ttl)?c:undefined:c;
            if(!c){
                onEventCacheMiss.next({key,type:'sync'});
            }
            return c;
        },
        getCompAsync:async (key:string,ttl?:number):Promise<MdxUiCachedComponent|undefined>=>{
            let p=loadCache[key];
            if(p){
                const r=await p;
                return isMdxUiCachedComponentExpired(r)?undefined:r;
            }
            p=(async ()=>{

                const loaded=await vfs().readObjectAsync(joinPaths(baseDir,key+ext));
                if(!loaded){
                    onEventCacheMiss?.next({
                        key,
                        type:'async',
                    });
                }

                const cached:MdxUiCachedComponent=loaded??{
                    compileResult:undefined,
                }

                if(!cache[key]){
                    cache[key]=cached;
                }

                return cached;
            })();
            loadCache[key]=p;
            return await p;
        },
        putCompAsync:async (key:string,compileResult:MdxUiCompileResult,ttl?:number)=>{

            const cached:MdxUiCachedComponent={
                compileResult,
                ttl:ttl===undefined?undefined:Date.now()+ttl,
            }

            loadCache[key]=Promise.resolve(cached);
            cache[key]=cached;

            await vfs().writeObjectAsync(joinPaths(baseDir,key+ext),cached);
        }
    }
}
