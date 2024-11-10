import { fsBase64Chars } from "./base64";
import { strHashBase64 } from "./string-hashing";

export const sortedObjSep="\u0001";
export const sortedObjPrefix={
    array:sortedObjSep+'a',
    arrayEnd:sortedObjSep+'b',
    false:sortedObjSep+'f',
    bigint:sortedObjSep+'i',
    key:sortedObjSep+'k',
    null:sortedObjSep+'l',
    number:sortedObjSep+'n',
    object:sortedObjSep+'o',
    objectEnd:sortedObjSep+'p',
    ref:sortedObjSep+'r',
    string:sortedObjSep+'s',
    true:sortedObjSep+'t',
    undefined:sortedObjSep+'u',
    function:sortedObjSep+'v',
    symbol:sortedObjSep+'y',
    other:sortedObjSep+'_',
} as const;
Object.freeze(sortedObjPrefix);

const removeNonPrintable=(value:string)=>{
    if(value.includes(sortedObjSep)){
        value=value.split(sortedObjSep).join('');
    }
    return value;
}

/**
 * Returns a hashed value of the object by deeply converting the object in to a string. When
 * converting objects to string the keys used to enumerate the object are sorted so that the string
 * that is used for the hash will be stable regardless of the order key values are assigned.
 *
 * @param checkForNonPrintableCharacters If true the \u0001 character will be removed from strings
 *                                       used to create the has. Only use if there if you think
 *                                       there may be non printable characters in strings
 *                                       or keys object object.
 * @returns
 */
export const getSortedObjectHash=(value:any,length=8,keyStr:string=fsBase64Chars,checkForNonPrintableCharacters=false):string=>{
    return strHashBase64(getSortedObjStrings(value,checkForNonPrintableCharacters),length,keyStr);
}

export const getSortedObjStrings=(value:any,checkForNonPrintableCharacters=false):string[]=>{
    const strings:string[]=[]
    _getSortedObjStrings(value,[],strings,checkForNonPrintableCharacters);
    return strings;
}

const _getSortedObjStrings=(value:any,objs:any[],strings:string[],rmNp:boolean):void=>{
    switch(typeof value){

        case 'string':
            strings.push(sortedObjPrefix.string+(rmNp?removeNonPrintable(value):value));
            break;

        case 'number':
            strings.push(sortedObjPrefix.number+value);
            break;

        case 'boolean':
            strings.push(value?sortedObjPrefix.true:sortedObjPrefix.false);
            break;

        case 'undefined':
            strings.push(sortedObjPrefix.undefined);
            break;

        case 'object':
            if(value===null){
                strings.push(sortedObjPrefix.null);
            }else{
                const e=objs.indexOf(value);
                if(e!==-1){
                    strings.push(sortedObjPrefix.ref+e);
                    return;
                }
                objs.push(value);
                if(Array.isArray(value)){
                    strings.push(sortedObjPrefix.array);
                    for(let i=0;i<value.length;i++){
                        _getSortedObjStrings(value[i],objs,strings,rmNp);
                    }

                    strings.push(sortedObjPrefix.arrayEnd);
                }else{
                    strings.push(sortedObjPrefix.object);
                    const keys=Object.keys(value);
                    keys.sort();
                    for(let k=0;k<keys.length;k++){
                        const key=keys[k];
                        const v=value[key as string];
                        const vt=typeof v;
                        if(vt==='undefined' || vt==='function' || vt==='symbol'){
                            continue;
                        }
                        strings.push(sortedObjPrefix.key+(rmNp?removeNonPrintable(key as string):key));
                        _getSortedObjStrings(v,objs,strings,rmNp);
                    }
                    strings.push(sortedObjPrefix.objectEnd);
                }
            }
            break;

        case 'bigint':
            strings.push(sortedObjPrefix.bigint+value);
            break;

        case 'function':
            strings.push(sortedObjPrefix.function);
            break;

        case 'symbol':
            strings.push(sortedObjPrefix.symbol);
            break;

        default:
            strings.push(sortedObjPrefix.other);
            break;

    }
}
