
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
    const parts=starString.split('*');
    for(let i=0;i<parts.length;i++){
        parts[i]=escapeRegex(parts[i] as string);
    }
    return new RegExp(
        (startEndOfInput==='both' || startEndOfInput==='start'?'^':'')+
        parts.join('.*?')+
        (startEndOfInput==='both' || startEndOfInput==='end'?'$':''),
        flags
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
            return starStringToRegex(starString).test(value);
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
