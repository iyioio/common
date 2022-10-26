import { v4 } from 'uuid';
import { base64EncodeAry, fsBase64Chars } from './base64';

export function uuid():string{
    return v4();
}

export function shortUuid():string{
    const buf:number[]=[];
    v4(undefined,buf,0);
    return base64EncodeAry(buf,fsBase64Chars)
}
