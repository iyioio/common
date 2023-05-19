import { uint32ArrayToNumberArray } from "./array";
import { base64EncodeAry, fsBase64Chars } from "./base64";
import { shortUuid } from "./uuid";


let triedNode=false;
let nodeCy:any=undefined;
const loadNodeCrypto=()=>{
    if(triedNode){
        return nodeCy;
    }
    triedNode=true;
    try{
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        nodeCy=require('node:crypto');
        return nodeCy;
    }catch{
        return undefined;
    }

}

/**
 * Returns an array of cryptographically secure Uint32(s)
 */
export const generateCryptoValues=(wordLength=32):Uint32Array=>{
    const value=_generateCrypto(wordLength);
    if(value instanceof Uint32Array){
        return value;
    }

    const ary=new Uint32Array(Math.ceil(wordLength/4));
    for(let i=0;i<value.length;i+=4){
        ary[i/4]=(
            (value[i] as number) |
            ((value[i+1] as number)<<8) |
                ((value[i+2] as number)<<16)|
                ((value[i+3] as number)<<24)
        );
    }
    return ary
}

/**
 * Returns an array of cryptographically secure bytes
 */
export const generateCryptoBytes=(wordLength=32):number[]=>{
    const value=_generateCrypto(wordLength);
    if(value instanceof Uint32Array){
        return uint32ArrayToNumberArray(value);
    }else{
        const ary=Array(value.length);
        for(let i=0;i<value.length;i++){
            ary[i]=value[i];
        }
        return ary;
    }
}

export const _generateCrypto=(wordLength=32):Uint32Array|Buffer=>{
    let cy:any=undefined;
    if(!globalThis.crypto){
        cy=loadNodeCrypto();
        if(cy===undefined){
            throw new Error('_generateCrypto not supported. crypto is undefined');
        }
    }else{
        cy=globalThis.crypto;
    }
    if(cy.getRandomValues){
        const ary=new Uint32Array(Math.ceil(wordLength/4));
        cy.getRandomValues(ary);
        return ary;
    }else if(cy.randomBytes){
        const bytes:Buffer=cy.randomBytes(Math.ceil(wordLength/4)*4);
        return bytes;
    }else{
        throw new Error('_generateCrypto not supported. crypto.randomBytes and crypto.getRandomValues are undefined')
    }
}

/**
 * Returns an array of cryptographically secure bytes encoded in base64 characters
 */
export const generateCryptoString=(wordLength=32)=>{
    const ary=generateCryptoBytes(wordLength);
    return base64EncodeAry(ary,fsBase64Chars);
}

/**
 * Returns an array of cryptographically secure bytes encoded in base64 characters and prefixed with
 * a uuid. The result is guaranteed to be unique and cryptographically random.
 */
export const generateCryptoUuidString=(wordLength=32)=>{
    const ary=generateCryptoBytes(wordLength);
    return shortUuid()+'.'+base64EncodeAry(ary,fsBase64Chars);
}
