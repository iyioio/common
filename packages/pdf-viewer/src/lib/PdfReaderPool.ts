import { aryRemoveFirst } from "@iyio/common";
import { PdfReader } from "./PdfReader.js";

let defaultPool:PdfReaderPool|null=null;
export const pdfReaderPool=()=>{
    return defaultPool??(defaultPool=new PdfReaderPool());
}

interface ReaderRecord
{
    source:string|File;
    reader:PdfReader;
}

export class PdfReaderPool
{
    private readonly readers:ReaderRecord[]=[];

    public targetPoolSizeLimit=20;

    public getReader(source:string|File):PdfReader
    {
        let reader=this.readers.find(f=>f.source===source);
        if(!reader){
            reader={
                source:source,
                reader:new PdfReader(source)
            }
            this.readers.push(reader);
        }
        reader.reader.refCount++;
        if(this.readers.length>this.targetPoolSizeLimit){
            console.warn(`PdfReaderPool targetPoolSizeLimit exceeded - ${this.readers.length}`);
        }
        return reader.reader;
    }

    public returnReader(reader:PdfReader){
        reader.refCount--;
        if(reader.refCount===0){
            setTimeout(()=>{
                if(reader.refCount===0){
                    aryRemoveFirst(this.readers,r=>r.reader===reader);
                    reader.dispose();
                }
            },2000);
        }
    }
}
