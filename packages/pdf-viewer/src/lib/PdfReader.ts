import { DisposeContainer, ReadonlySubject, readBlobAsUint8ArrayAsync } from '@iyio/common';
import { GlobalWorkerOptions, PDFDocumentProxy, PDFPageProxy, getDocument } from 'pdfjs-dist';
import { BehaviorSubject } from 'rxjs';

export class PdfReader
{
    public readonly url:string|File;

    private readonly _doc:BehaviorSubject<PDFDocumentProxy|null>=new BehaviorSubject<PDFDocumentProxy|null>(null);
    public get docSubject():ReadonlySubject<PDFDocumentProxy|null>{return this._doc}
    public get doc(){return this._doc.value}

    public refCount=0;

    public constructor(url:string|File)
    {
        GlobalWorkerOptions.workerSrc='/pdfjs/build/pdf.worker.min.js';
        this.url=url;
    }

    private readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.disposables.dispose();
    }

    private docPromise:Promise<any>|null=null;
    public async getDocAsync():Promise<PDFDocumentProxy|null>
    {
        return await (this.docPromise??(this.docPromise=this._getDocAsync()));
    }

    private async _getDocAsync():Promise<PDFDocumentProxy|null>
    {
        const loader=getDocument({
            url:(typeof this.url === 'string')?this.url:undefined,
            data:(typeof this.url === 'string')?undefined:await readBlobAsUint8ArrayAsync(this.url),
            enableXfa:true,
        });
        this.disposables.addCb(()=>loader.destroy());

        if(this.isDisposed){
            return null;
        }

        const doc=await loader.promise;
        this.disposables.addCb(()=>doc.destroy());

        if(this.isDisposed){
            return null;
        }

        this._doc.next(doc);

        return doc;
    }


    private pagePromises:Record<number,Promise<{page:PDFPageProxy,doc:PDFDocumentProxy}|null>>={};

    public async getPageAsync(pageIndex:number):Promise<{page:PDFPageProxy,doc:PDFDocumentProxy}|null>{
        return await (this.pagePromises[pageIndex]??(this.pagePromises[pageIndex]=this._getPageAsync(pageIndex)));
    }

    private async _getPageAsync(pageIndex:number):Promise<{page:PDFPageProxy,doc:PDFDocumentProxy}|null>{

        if(pageIndex<0){
            return null;
        }

        const doc=await this.getDocAsync();

        if(this.isDisposed || !doc || doc.numPages-1<pageIndex){
            return null;
        }

        const page=await doc.getPage(pageIndex+1);
        this.disposables.addCb(()=>page.cleanup());
        if(this.isDisposed){
            return null;
        }

        return {page,doc};
    }

    public async pageToImageAsync(pageIndex:number,format='image/jpeg',quality=0.7):Promise<Blob|null>{

        if(!globalThis.document){
            return null;
        }

        const page=(await this.getPageAsync(pageIndex))?.page;
        if(!page){
            return null;
        }

        const canvas=globalThis.document.createElement('canvas');

        const context=canvas.getContext('2d');
        if(!context){
            return null;
        }

        const viewport=page.getViewport({scale:1});
        canvas.width=viewport.width;
        canvas.height=viewport.height;


        await page.render({
            canvasContext:context,
            viewport
        }).promise;

        return await new Promise((r)=>{
            canvas.toBlob(blob=>{
                r(blob);
            },format,quality);
        });
    }


}

export const getPdfImageAsync=async (file:string|File,pageIndex:number):Promise<Blob|null>=>{
    const reader=new PdfReader(file);
    try{
        return await reader.pageToImageAsync(pageIndex);
    }finally{
        reader.dispose();
    }
}
