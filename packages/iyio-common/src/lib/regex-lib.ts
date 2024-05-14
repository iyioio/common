/**
 * Escapes special regular expression characters
 */
export const escapeRegex=(input:string):string=>{
    return input.replace(/[-[\]{}()*+?.,\\^$|]/g, "\\$&");
}

export type StarStringStartEndOfInput='none'|'start'|'end'|'both';
/**
 * Creates a regular expression from the given string where star (*) characters are converted to `.*?`
 * @param str The string to convert
 * @param startEndOfInput Controls start and end of characters.
 *                        For the string abc*123 the following start and end of input characters will be used.
 *                        none - /abc.*?123/
 *                        start - /^abc.*?123/
 *                        end - /abc.*?123$/
 *                        both - /^abc.*?123$/
 * @params flags flags passed to the Regex constructor
 */
export const starStringToRegex=(
    str:string,
    flags?:string,
    startEndOfInput:StarStringStartEndOfInput='both',
):RegExp=>{
    const parts=str.split('*');
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
