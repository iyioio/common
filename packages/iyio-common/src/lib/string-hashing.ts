import { base64EncodeUint32Array, defaultBase64Chars, fsBase64Chars } from "./base64.js";

export const strHash=(str:string):number=>{
    if(!str){
        return 0;
    }
    let h=0;
    const l=str.length;
    for (let i=0,c:number;i<l;i++) {
        c=str.charCodeAt(i);
        h=((h<<5)-h)+c;
        h|=0; // Convert to 32bit integer
    }
    return h;
}

export const strHashToAry=(str:string,fillAry:Uint32Array,aryLen=fillAry.length):void=>{
    fillAry.fill(0);
    if(!fillAry.length){
        return;
    }
    if(!str){
        str='';
    }
    const l=str.length;
    for (let i=0,c:number;i<l;i++) {
        c=str.charCodeAt(i);
        const n=i%aryLen;
        let h=fillAry[n] as number;
        h=((h<<5)-h)+c;
        h|=0; // Convert to 32bit integer
        fillAry[n]=h;
    }
}

export const strAryHashToAry=(strings:string[],fillAry:Uint32Array,aryLen=fillAry.length):void=>{
    fillAry.fill(0);
    if(!fillAry.length){
        return;
    }
    let allI=0;
    for(let s=0;s<strings.length;s++){
        const str=strings[s]??'';
        const l=str.length;
        for (let i=0,c:number;i<l;i++) {
            c=str.charCodeAt(i);
            const n=allI%aryLen;
            let h=fillAry[n] as number;
            h=((h<<5)-h)+c;
            h|=0; // Convert to 32bit integer
            fillAry[n]=h;
            allI++;
        }
    }
}


export const strHashBase64=(str:string|string[],length=8,keyStr:string=defaultBase64Chars):string=>{
    const fillAry=new Uint32Array(length);
    if(Array.isArray(str)){
        strAryHashToAry(str,fillAry);
    }else{
        strHashToAry(str,fillAry);
    }
    let len=fillAry.length;
    while(fillAry[len-1]===0){
        len--;
    }
    return base64EncodeUint32Array(fillAry,keyStr,len);
}

export const strHashBase64Fs=(str:string|string[],length=8,keyStr:string=fsBase64Chars):string=>{
    return strHashBase64(str,length,keyStr);
}
