
/**
 * Escapes special regular expression characters
 */
export const escapeRegex=(input:string):string=>{
    return input.replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&");
}

export type StarStringStartEndOfInput='none'|'start'|'end'|'both';
/**
 * Creates a regular expression from the given string where star (*) characters are converted to `.*?`
 * @param starString The string to convert
 * @param startEndOfInput Controls start and end of characters.
 *                        For the string abc*123 the following start and end of input characters will be used.
 *                        none - /abc.*?123/
 *                        start - /^abc.*?123/
 *                        end - /abc.*?123$/
 *                        both - /^abc.*?123$/
 * @params flags flags passed to the Regex constructor
 */
export const starStringToRegex=(
    starString:string,
    flags?:string,
    startEndOfInput:StarStringStartEndOfInput='both',
):RegExp=>{
    return new RegExp(starStringToRegexString(starString,startEndOfInput),flags);
}

export const starStringToRegexString=(
    starString:string,
    startEndOfInput:StarStringStartEndOfInput='both',
):string=>{
    const parts=starString.split('*');
    for(let i=0;i<parts.length;i++){
        parts[i]=escapeRegex(parts[i] as string);
    }
    return (
        (startEndOfInput==='both' || startEndOfInput==='start'?'^':'')+
        parts.join('.*?')+
        (startEndOfInput==='both' || startEndOfInput==='end'?'$':'')
    )
}

export const starStringTest=(
    starString:string,
    value:string,
    flags?:string,
    startEndOfInput:StarStringStartEndOfInput='both'
):boolean=>{
    try{
        if(starString.includes('*')){
            return starStringToRegex(starString,flags,startEndOfInput).test(value);
        }
        if(flags?.includes('i')){
            return starString.localeCompare(value,undefined,{sensitivity:'accent'})===0
        }else{
            return starString===value;
        }
    }catch(ex){
        console.error(`Invalid starString - (${starString})`)
        return false;
    }
}

export const starStringTestCached=(
    cacheObj:Record<string,any>,
    starString:string,
    value:string,
    flags?:string,
    startEndOfInput:StarStringStartEndOfInput='both',
    treatAsNormalReg?:boolean
):boolean=>{
    try{
        if(starString.includes('*') || treatAsNormalReg){
            const cache=getStarCache();
            let reg=cache.get(cacheObj);
            if(!reg || reg.pattern!==starString){
                reg={
                    reg:treatAsNormalReg?new RegExp(starString,flags):starStringToRegex(starString,flags,startEndOfInput),
                    pattern:starString
                }
                cache.set(cacheObj,reg);
            }
            return reg.reg.test(value);
        }
        if(flags?.includes('i')){
            return starString.localeCompare(value,undefined,{sensitivity:'accent'})===0
        }else{
            return starString===value;
        }
    }catch(ex){
        console.error(`Invalid starString - (${starString})`)
        return false;
    }
}

export const parseRegexCached=(cacheObj:any,reg:string|RegExp,flags?:string):RegExp=>{
    if(typeof reg !== 'string'){
        return reg;
    }

    const cache=getNormCache();
    const pattern=reg+(flags??'');
    const cached=cache.get(cacheObj);
    if(cached && cached.pattern===pattern){
        return cached.reg;
    }
    reg=new RegExp(reg,flags);
    cache.set(cacheObj,{reg,pattern});
    return reg;


}

let starRegCache:WeakMap<any,CachedReg>|undefined=undefined;
const getStarCache=()=>{
    return starRegCache??(starRegCache=new WeakMap());
}
let normRegCache:WeakMap<any,CachedReg>|undefined=undefined;
const getNormCache=()=>{
    return normRegCache??(normRegCache=new WeakMap());
}
interface CachedReg
{
    reg:RegExp;
    pattern:string;
}
