import { generateCryptoBytes, generateCryptoString, generateCryptoUuidString, generateCryptoValues } from "./crypto-bytes";

describe('crypto-bytes',()=>{

    it('should generate crypto values',()=>{
        const length=32;
        const bytes=generateCryptoValues(length);
        expect(bytes).toBeInstanceOf(Uint32Array);
        expect(bytes.length).toBe(length/4);
        expect(bytes.some(b=>b!==0)).toBe(true);
        expect(bytes.every(b=>(typeof b === 'number'))).toBe(true);
    })

    it('should generate crypto bytes',()=>{
        const length=32;
        const bytes=generateCryptoBytes(length);
        expect(Array.isArray(bytes)).toBe(true);
        expect(bytes.length).toBe(length);
        expect(bytes.some(b=>b!==0)).toBe(true);
        expect(bytes.every(b=>(typeof b === 'number'))).toBe(true);
    })

    it('should generate crypto string',()=>{
        const length=32;
        const bytes=generateCryptoString(length);
        expect(typeof bytes === 'string').toBe(true);
    })

    it('should generate crypto uuid string',()=>{
        const length=32;
        const bytes=generateCryptoUuidString(length);
        expect(typeof bytes === 'string').toBe(true);
        expect(bytes.includes('.')).toBe(true);
    })

});
