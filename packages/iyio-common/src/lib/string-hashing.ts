import { base64EncodeUint32Array, defaultBase64Chars } from "./base64";

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


export const strHashBase64=(str:string,length=8,keyStr:string=defaultBase64Chars):string=>{
    const fillAry=new Uint32Array(length);
    strHashToAry(str,fillAry);
    let len=fillAry.length;
    while(fillAry[len-1]===0){
        len--;
    }
    return base64EncodeUint32Array(fillAry,keyStr,len);

}
