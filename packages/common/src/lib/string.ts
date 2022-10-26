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


export const addSpacesToCamelCase=(value:string):string=>{
    if(!value){
        return value;
    }

    let i=0;
    let wasUpper=true;
    while(i<value.length){
        const ch=value[i];
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
