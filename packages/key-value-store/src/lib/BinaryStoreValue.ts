
export type BinaryValueType=Uint8Array;

export class BinaryStoreValue
{
    public readonly content:BinaryValueType;
    public readonly contentType:string;
    public readonly length?:number;

    public constructor(contentType:string,content:BinaryValueType,length?:number)
    {
        this.contentType=contentType;
        this.content=content;
        this.length=length;
    }
}
