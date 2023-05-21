
export interface CryptoMethods
{
    getRandomValues?(array:Uint32Array):Uint32Array;
    randomBytes?(length:number):Buffer;
}
