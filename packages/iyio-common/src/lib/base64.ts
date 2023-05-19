/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/

import { uint32ArrayToNumberArray } from "./array";

export const defaultBase64Chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
// the ending (=) is not required since it is only used for padding
export const fsBase64Chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

/**
 * Encodes a string to a base64 string
 */
export const base64Encode=(input:string,keyStr:string=defaultBase64Chars):string=>
{
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;

    input = _utf8_encode(input);

    while (i < input.length) {

        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
        keyStr.charAt(enc1) + keyStr.charAt(enc2) +
        keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

/**
 * Encodes an array of numbers into a base 64 string
 */
export const base64EncodeAry=(input:number[],keyStr:string=defaultBase64Chars):string=>
{
    let output = "";
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;

    while (i < input.length) {

        chr1 = input[i++] as number;
        chr2 = input[i++] as number;
        chr3 = input[i++] as number;

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
        keyStr.charAt(enc1) + keyStr.charAt(enc2) +
        keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
}

/**
 * Encodes an array of numbers into a base 64 string
 */
export const base64EncodeUint32Array=(input:Uint32Array,keyStr:string=defaultBase64Chars):string=>
{
    return base64EncodeAry(uint32ArrayToNumberArray(input),keyStr);
}

/**
 * Decodes a base64 string
 */
export const base64Decode=(input:string,keyStr:string=defaultBase64Chars):string=>
{
    let output = "";
    let chr1, chr2, chr3;
    let enc1, enc2, enc3, enc4;
    let i = 0;

    // eslint-disable-next-line no-useless-escape
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while (i < input.length) {

        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }
    }

    output = _utf8_decode(output);

    return output;
}

const _utf8_encode=(str:string)=>
{
    str = str.replace(/\r\n/g,"\n");
    let utfText = "";

    for (let n = 0; n < str.length; n++) {

        const c = str.charCodeAt(n);

        if (c < 128) {
            utfText += String.fromCharCode(c);
        }
        else if((c > 127) && (c < 2048)) {
            utfText += String.fromCharCode((c >> 6) | 192);
            utfText += String.fromCharCode((c & 63) | 128);
        }
        else {
            utfText += String.fromCharCode((c >> 12) | 224);
            utfText += String.fromCharCode(((c >> 6) & 63) | 128);
            utfText += String.fromCharCode((c & 63) | 128);
        }
    }
    return utfText;
}

const _utf8_decode=(utfText:string):string=>
{
    let string = "";
    let i = 0;
    let c = 0;
    let c2 = 0;
    let c3 = 0;

    while ( i < utfText.length ) {

        c = utfText.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if((c > 191) && (c < 224)) {
            c2 = utfText.charCodeAt(i+1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utfText.charCodeAt(i+1);
            c3 = utfText.charCodeAt(i+2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return string;
}
