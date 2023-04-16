import { HashMap } from "./common-types";

export type KeyComparer=(key:string,depth:number,a:any,b:any,state:any)=>boolean|undefined;

export const deepCompare=(
    a:any,
    b:any,
    keyComparer?:KeyComparer,
    keyComparerState?:any,
    maxDepth=200,
    depth=0
):boolean=>{

    if(maxDepth<0){
        throw new Error('deepCompare max depth reached');
    }
    maxDepth--;
    const type=typeof a;
    if(type !== (typeof b)){
        return false
    }

    if(type !== 'object'){
        return a===b;
    }

    if(a===null){
        return a===b;
    }else if(b===null){
        return false;
    }

    if(Array.isArray(a)){
        if(a.length!==b.length){
            return false;
        }
        for(let i=0;i<a.length;i++){
            if(!deepCompare(a[i],b[i],keyComparer,keyComparerState,maxDepth,depth+1))
            {
                return false;
            }
        }
    }else{
        let ac=0;
        for(const e in a){
            ac++;
            if(keyComparer){
                const r=keyComparer(e,depth,a,b,keyComparerState);
                if(r===false){
                    return false;
                }else if(r===true){
                    continue;
                }
            }
            if(!deepCompare(a[e],b[e],keyComparer,keyComparerState,maxDepth,depth+1))
            {
                return false;
            }
        }
        let dc=0;
        for(const e in b){// eslint-disable-line
            dc++;
        }
        if(ac!==dc){// ;)
            return false;
        }
    }

    return true;


}


export const deepClone=<T>(obj:T, maxDepth=20):T=>
{
    if(maxDepth<0){
        throw new Error('deepClone max depth reached');
    }
    maxDepth--;
    if(!obj || typeof obj !== 'object'){
        return obj;
    }

    if(Array.isArray(obj)){
        const clone:any[]=[];
        for(let i=0;i<obj.length;i++){
            clone.push(deepClone(obj[i],maxDepth));
        }
        return clone as any;
    }else{
        const clone:any={}
        for(const e in obj){
            clone[e]=deepClone(obj[e],maxDepth);
        }
        return clone;
    }


}

export const deleteUndefined=<T>(obj:T):T=>
{
    if(!obj){
        return obj;
    }
    for(const e in obj){
        if(obj[e]===undefined){
            delete obj[e];
        }
    }
    return obj;
}

export const getValueByPath=(value:any,path:string,defaultValue:any=undefined,rootGetter?:(key:string)=>any):any=>{

    const parts=path.split('.');
    for(let i=0;i<parts.length;i++){
        const p=parts[i].trim();
        if(!p){
            continue;
        }
        if(i===0 && rootGetter && value?.[p]===undefined){
            value=rootGetter(p);
        }else{
            value=value?.[p];
        }
    }

    return value===undefined?defaultValue:value;
}

export const getNextEmptyAlphaKey=(obj:HashMap):string=>
{
    const alpha='abcdefghijklmnopqrstubwzyz';

    let post='';
    let key=alpha[0];
    let i=0;
    while(true){
        if(obj[key+post]===undefined){
            return key+post;
        }
        i++;
        if(i>=alpha.length){
            post=post?(Number(post)+1).toString():'2';
            i=0;
        }
        key=alpha[i];
    }
}

export const serializeWithRefs=(obj:any,space:number)=>
{
    const cache:any[] = [];
    return JSON.stringify(obj, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            const i=cache.indexOf(value);
            if (i !== -1) {
                return {objRef:i}
            }
            cache.push(value);
        }
        return value;
    },space);
}

export const toJsonPretty=(obj:any):string=>
{
    return serializeWithRefs(obj,2);
}


export const areShallowEqual=<T=any>(a:T, b:T, shouldTestKey?:(key:keyof T)=>boolean):boolean=>
{
    if(!a && !b)
        return true;

    if(!a || !b)
        return false;

    for(const key in a) {
        if(shouldTestKey && !shouldTestKey(key as any)){
            continue;
        }
        if(!(key in (b as any)) || a[key] !== b[key]) {
            return false;
        }
    }
    for(const key in b) {
        if(shouldTestKey && !shouldTestKey(key as any)){
            continue;
        }
        if(!(key in (a as any)) || a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

export const mapObj=<T,R>(obj:{[key:string]:T},select:(key:string,value:T)=>R):R[]=>
{
    const ary:R[]=[];
    if(!obj)
        return ary;

    for(const e in obj){
        ary.push(select(e,obj[e]));
    }

    return ary;
}

export const objHasValues=(obj:any)=>
{
    if(!obj){
        return false;
    }
    for(const e in obj){
        return true;
    }
    return false;
}


export type MergeObjsTest=(a:any,b:any,depth:number,key:string|number|undefined)=>boolean

const _mergeObjs=(
    a:any,
    b:any,
    maxDepth:number,
    depth:number,
    key:string|number|undefined,
    aryMerge:MergeObjsTest|undefined
):any=>{
    const aType=typeof a;
    const bType=typeof b;

    if(!a || !b || aType!==bType || aType!=='object'){
        return a;
    }

    if(Array.isArray(a)){
        const ary=[...a,...b];
        if(aryMerge){
            for(let ai=0;ai<ary.length;ai++){
                for(let bi=ai+1;bi<ary.length;bi++){
                    const itemA=ary[ai];
                    const itemB=ary[bi];
                    if(aryMerge(itemA,itemB,depth,key)){
                        ary[ai]=_mergeObjs(itemA,itemB,maxDepth,depth+1,ai,aryMerge);
                        ary.splice(bi,1);
                        bi--;
                    }
                }
            }
        }
        return ary;
    }else{
        const m={...a}
        for(const e in b){
            if(m[e]===undefined){
                m[e]=b[e];
            }else if(typeof b[e] === 'object'){
                m[e]=_mergeObjs(m[e],b[e],maxDepth,depth+1,e,aryMerge);
            }
        }
        return m;
    }


}

export const mergeObjs=(a:any,b:any, aryMerge?:MergeObjsTest, maxDepth:number=1000):any=>
{
    return _mergeObjs(a,b,maxDepth,0,undefined,aryMerge)
}


export const mergeObjAry=(ary:any[], aryMerge?:MergeObjsTest, maxDepth:number=1000):any=>
{

    let m:any={};
    if(!ary?.length){
        return m;
    }
    for(const o of ary){
        m=_mergeObjs(m,o,maxDepth,0,undefined,aryMerge);
    }
    return m;
}

export const getObjKeyCount=(obj:HashMap|null|undefined):number=>{
    if(!obj){
        return 0;
    }
    let c=0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for(const _ in obj){
        c++;
    }
    return c;
}

export const objGetFirstValue=(obj:HashMap):any=>{
    if(!obj){
        return undefined;
    }
    for(const e in obj){
        return obj[e];
    }
    return undefined;
}

export const objectToQueryParams=(obj:HashMap):string=>{
    const values:string[]=[];
    for(const e in obj){
        values.push(encodeURIComponent(e)+'='+encodeURIComponent(obj[e]?.toString()??'true'))
    }
    return values.join('&');
}

export const queryParamsToObject=(query:string):HashMap<string>=>
{
    if(query.startsWith('?')){
        query=query.substring(1);
    }

    const obj:HashMap<string>={};

    const parts=query.split('?');
    for(const p of parts){
        const [name,value]=p.split('=',2);
        const n=decodeURIComponent(name).trim();
        if(!n){
            continue;
        }
        obj[n]=decodeURIComponent(value?.trim()??'');
    }

    return obj;
}
