export const trimStrings=(obj:any,maxDepth:number=20)=>{

    maxDepth--;

    if(maxDepth<0){
        return obj;
    }

    if(typeof obj === 'string'){
        return (obj as string).trim();
    }

    if(Array.isArray(obj)){
        for(let i=0;i<obj.length;i++){
            obj[i]=trimStrings(obj[i],maxDepth);
        }
        return obj;
    }

    if(typeof obj === 'object'){
        for(const e in obj){
            obj[e]=trimStrings(obj[e],maxDepth);
        }
        return obj;
    }

    return obj;

}

export const strFirstToUpper=(str:string)=>
{
    if(!str){
        return str;
    }

    return str.substring(0,1).toUpperCase()+str.substring(1);
}

export const strFirstToLower=(str:string)=>
{
    if(!str){
        return str;
    }

    return str.substring(0,1).toLowerCase()+str.substring(1);
}


export const addSpacesToCamelCase=(value:string):string=>{
    if(!value){
        return value;
    }

    let i=0;
    let wasUpper=true;
    while(i<value.length){
        const ch=value[i] as string;
        const upper=ch.toUpperCase()===ch;
        if(!wasUpper && upper){
            value=value.substr(0,i)+' '+value.substr(i);
            i+=2;
            wasUpper=true;
        }else{
            i++;
            wasUpper=upper;
        }
    }
    return value;
}

export const getSubstringCount=(str:string,substring:string):number=>{
    let count=0;
    let i=0;
    if(!substring){
        return 0
    }else if(substring.length===1){
        for(let i=0;i<str.length;i++){
            if(str[i]===substring){
                count++;
            }
        }
    }else{
        while((i=str.indexOf(substring,i))!==-1){
            count++;
            i+=substring.length;
        }
    }
    return count;
}

interface SplitStringWithQuoteOptions{
    separator:string;
    trimValues?:boolean;
    escapeStyle?:'backslash'|'double-quote';
    removeEmptyValues?:boolean;
    keepQuotes?:boolean;
}

/**
 * Splits a string by the given separate but allows the separator to be inside quotes.
 * @example 'abc,"1,2,3",zyx' -> ['abc','1,2,3','xyz']
 */
export const splitStringWithQuotes=(str:string,{
    separator,
    trimValues=false,
    escapeStyle='backslash',
    removeEmptyValues=false,
    keepQuotes=false
}:SplitStringWithQuoteOptions):string[]=>{
    const ary:string[]=[];

    let i=0;
    let value='';
    let firstChar=true;
    let quoteChar:'"'|"'"|null=null;
    for(;i<str.length;i++){
        const ch=str.charAt(i);

        if(firstChar){
            quoteChar=ch==='"'?'"':ch==="'"?"'":null;
            if(keepQuotes && quoteChar){
                value+=ch;
            }
            firstChar=false;
            if(quoteChar){
                continue;
            }else if(/\s/.test(ch)){
                firstChar=true;
            }
        }

        if(quoteChar){
            if(ch===quoteChar){
                if(escapeStyle==='backslash' && str.charAt(i-1)==='\\'){
                    value=value.substring(0,value.length-1)+ch;
                }else if(escapeStyle==='double-quote' && str.charAt(i+1)===quoteChar){
                    value+=ch;
                    i++
                }else{
                    if(keepQuotes){
                        value+=ch;
                    }
                    quoteChar=null;
                }
            }else{
                value+=ch;
            }
        }else if(ch===separator){
            if(trimValues){
                value=value.trim();
            }
            if(!removeEmptyValues || value){
                ary.push(value);
            }
            value='';
            firstChar=true;
        }else{
            value+=ch;
        }

    }
    if(trimValues){
        value=value.trim();
    }
    if(!removeEmptyValues || value){
        ary.push(value);
    }

    return ary;
}
