import { base64EncodeAry, fsBase64Chars } from './base64.js';

let _uuid:(()=>string)|undefined;

const g=(globalThis) as any as {
    crypto:{
        randomUUID:()=>string;
        getRandomValues:(bytes:Uint8Array)=>void;
    }
};
const crypto=g.crypto;

export function uuid():string{
    if(_uuid){
        return _uuid();
    }
    if(typeof crypto?.randomUUID === 'function'){
        _uuid=()=>{
            return crypto.randomUUID();
        }
    }else if(typeof crypto?.getRandomValues === 'function'){
        _uuid=rnd;
    }else{
        throw new Error('crypto.randomUUID and crypto.getRandomValues not defined in global scope');
    }
    return _uuid();
}

const randomBytes=new Uint8Array(16);
const rnd=()=>{
    crypto.getRandomValues(randomBytes);
    randomBytes[6]=((randomBytes[6] as number) & 0x0f)|0x40;
    randomBytes[8]=((randomBytes[8] as number) & 0x3f)|0x80;
    return unsafeStringify(randomBytes);
}

export function shortUuid():string{
    if(typeof crypto?.getRandomValues !== 'function'){
        throw new Error('crypto.getRandomValues not defined in global scope');
    }
    crypto.getRandomValues(randomBytes);
    randomBytes[6]=((randomBytes[6] as number) & 0x0f)|0x40;
    randomBytes[8]=((randomBytes[8] as number) & 0x3f)|0x80;
    return base64EncodeAry(randomBytes,fsBase64Chars)
}

let byteToHex:string[]|undefined;

function unsafeStringify(arr: Uint8Array, offset = 0): string {

    if(!byteToHex){
        byteToHex=[];
        for (let i = 0; i < 256; ++i) {
            byteToHex.push((i + 0x100).toString(16).slice(1));
        }
    }

    // Note: Be careful editing this code!  It's been tuned for performance
    // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
    //
    // Note to future-self: No, you can't remove the `toLowerCase()` call.
    // REF: https://github.com/uuidjs/uuid/pull/677#issuecomment-1757351351
    return (
        (byteToHex[arr[offset + 0] as number] as string) +
        (byteToHex[arr[offset + 1] as number] as string) +
        (byteToHex[arr[offset + 2] as number] as string) +
        (byteToHex[arr[offset + 3] as number] as string) +
        '-' +
        (byteToHex[arr[offset + 4] as number] as string) +
        (byteToHex[arr[offset + 5] as number] as string) +
        '-' +
        (byteToHex[arr[offset + 6] as number] as string) +
        (byteToHex[arr[offset + 7] as number] as string) +
        '-' +
        (byteToHex[arr[offset + 8] as number] as string) +
        (byteToHex[arr[offset + 9] as number] as string) +
        '-' +
        (byteToHex[arr[offset + 10] as number] as string) +
        (byteToHex[arr[offset + 11] as number] as string) +
        (byteToHex[arr[offset + 12] as number] as string) +
        (byteToHex[arr[offset + 13] as number] as string) +
        (byteToHex[arr[offset + 14] as number] as string) +
        (byteToHex[arr[offset + 15] as number] as string)
    ).toLowerCase();
}
