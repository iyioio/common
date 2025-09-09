export interface FileBlobOptions
{
    lastModified?:number;
}

export class FileBlob extends Blob
{
    public readonly lastModified:number;

    public readonly name:string;

    public constructor(parts:BlobPart[],name:string,options:BlobPropertyBag,{
        lastModified=Date.now()
    }:FileBlobOptions={}){
        super(parts,options);
        this.name=name;
        this.lastModified=lastModified;
    }
}
