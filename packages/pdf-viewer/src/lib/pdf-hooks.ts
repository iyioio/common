import { ElementSizeObserver, delayAsync, httpClient, isServerSide } from "@iyio/common";
import { VfsItem } from "@iyio/vfs";
import { PDFDocumentProxy, PDFPageProxy, PageViewport, PixelsPerInch } from "pdfjs-dist";
import type { EventBus, PDFPageView } from "pdfjs-dist/web/pdf_viewer.js";
import { useEffect, useState } from "react";
import { PdfReader } from "./PdfReader.js";
import { pdfReaderPool } from "./PdfReaderPool.js";
import { getPdfSource } from "./pdf-lib.js";

export type PdfViewerLib=
{
    EventBus:EventBus & {new():EventBus};
    PDFPageView:PDFPageView & {new(options:any):PDFPageView}
}


let inserted=false;
let cssReady=false;
const insertResourceElements=()=>{
    if(inserted || isServerSide){
        return;
    }
    inserted=true;
    (async ()=>{
        const styleId='pdf-js-viewer-css-in-js';
        if(document.getElementById(styleId)){
            cssReady=true;
            return;
        }

        const pdfJsViewerCss=await httpClient().getStringAsync('/pdfjs/web/pdf_viewer.css');
        if(!pdfJsViewerCss){
            console.error('Unable to load PdfJs viewer css');
            return;
        }

        const style=document.createElement('style');
        style.id=styleId;
        style.innerHTML=pdfJsViewerCss;
        document.head.append(style);
        cssReady=true;
    })();

    const scriptId='pdf-js-viewer-js';
    if(document.getElementById(scriptId)){
        return;
    }

    const script=document.createElement('script');
    script.id=scriptId;
    script.src='/pdfjs/web/pdf_viewer.js';
    document.head.append(script);


}

export const usePdfViewerLib=():PdfViewerLib|null=>{

    const [lib,setLib]=useState<PdfViewerLib|null>(cssReady?(globalThis.window as any)?.pdfjsViewer??null:null);

    useEffect(()=>{
        insertResourceElements();
        let m=true;
        const check=()=>{
            if(!m){
                return;
            }
            const lib=(window as any).pdfjsViewer;
            if(cssReady && lib){
                setLib(lib);
                clearInterval(iv);
            }
        }
        const iv=setInterval(check,1);
        check();
        return ()=>{
            clearInterval(iv);
            m=false;
        }
    },[]);

    return lib;
}

export const usePdfReader=(source:string|File|VfsItem|null|undefined)=>{
    source=getPdfSource(source);
    const src=source;
    const [reader,setReader]=useState<PdfReader|null>(null);
    useEffect(()=>{

        setReader(null);

        if(!src){
            return;
        }
        const reader=pdfReaderPool().getReader(src);
        if(!reader){
            return;
        }

        setReader(reader);

        return ()=>{
            pdfReaderPool().returnReader(reader);
        }

    },[src]);
    return reader;
}

export const usePdfPage=(
    source:string|File|VfsItem|null|undefined,
    pageIndex:number|null|undefined,
    container:HTMLDivElement|null|undefined
)=>{

    const oSource=source;
    source=getPdfSource(source);
    const src=source;

    const [_doc,setDoc]=useState<PDFDocumentProxy|null>(null);
    const [_reader,setReader]=useState<PdfReader|null>(null);
    const [page,setPage]=useState<PDFPageProxy|null>(null);
    const [ready,setReady]=useState(false);

    const doc:PDFDocumentProxy|null=(oSource as any)?.[pdfSourceDocKey]??_doc;
    const reader:PdfReader|null=(oSource as any)?.[pdfSourceReaderKey]??_reader;

    const pdfjsViewer=usePdfViewerLib();

    useEffect(()=>{

        setReader(null);

        if(!src){
            return;
        }
        const reader=pdfReaderPool().getReader(src);
        if(!reader){
            return;
        }

        setReader(reader);

        return ()=>{
            pdfReaderPool().returnReader(reader);
        }

    },[src]);


    useEffect(()=>{

        if((typeof pageIndex !== 'number') || !reader){
            setPage(null);
            return;
        }

        let m=true;

        reader.getPageAsync(pageIndex).then((r)=>{
            if(m && r){
                setDoc(r.doc);
                setPage(r.page);
            }
        })

        return ()=>{
            m=false;
        }

    },[reader,pageIndex]);

    const [pageState,setPageState]=useState<{pageView:PDFPageView,viewport:PageViewport,eventBus:EventBus}|null>(null);

    useEffect(()=>{

        setReady(false);
        setPageState(null);

        if(!page || !container || !doc || (typeof pageIndex!=='number') || !pdfjsViewer){
            return;
        }

        const eventBus=new pdfjsViewer.EventBus();

        // const linkService:PDFLinkService=new pdfjsViewer.PDFLinkService({eventBus});

        // const findController:PDFFindController=new pdfjsViewer.PDFFindController({
        //     eventBus,
        //     linkService,
        // });
        // const viewer:PDFSinglePageViewer=new pdfjsViewer.PDFSinglePageViewer({
        //     container,
        //     eventBus:eventBus,
        //     linkService,
        //     findController,
        // })
        // viewer.currentPageNumber=pageIndex
        // linkService.setViewer(viewer);

        // eventBus.on("pagesinit", function () {
        //     // We can use pdfSinglePageViewer now, e.g. let's change default scale.
        //     viewer.currentScaleValue = "page-width";
        //     viewer.currentPageNumber=pageIndex
        //     setViewer(viewer);
        // });

        // viewer.setDocument(doc);
        // linkService.setDocument(doc);

        const viewport=page.getViewport({scale:1});

        const pageView=new pdfjsViewer.PDFPageView({
            container,
            eventBus,
            id:pageIndex,
            defaultViewport:viewport,
        });
        pageView.pdfPage=page;

        setPageState({pageView,viewport,eventBus});

        return ()=>{
            pageView.destroy();
            container.innerHTML=''
        }


        // const canvas=document.createElement('canvas');

        // const context=canvas.getContext('2d');
        // if(!context){
        //     return;
        // }
        // container.append(canvas);

        // const viewport=page.getViewport({scale:1});
        // const outputScale = window.devicePixelRatio || 1;
        // canvas.width=viewport.width;
        // canvas.height=viewport.height;

        // let m=true;

        // page.render({
        //     canvasContext:context,
        //     viewport
        // }).promise.then(()=>{
        //     if(m){
        //         setReady(true);
        //     }
        // })

        // return ()=>{
        //     m=false;
        //     canvas.remove();
        // }

    },[page,pageIndex,container,doc,pdfjsViewer]);

    useEffect(()=>{
        if(!container || !pageState){
            return;
        }
        const ob=new ElementSizeObserver(container);

        const {pageView,viewport}=pageState;


        let isDrawing=false;
        let drawRequested=false;
        let m=true;
        let lastWidth=0;
        let lastHeight=0;
        let first=true;
        const update=async ()=>{

            const pageElem=container.querySelector('.page');
            if( !(pageElem instanceof HTMLElement) ||
                !m ||
                (Math.abs(container.clientWidth-lastWidth)<4 &&
                Math.abs(container.clientHeight-lastHeight)<4))
            {
                return;
            }

            if(isDrawing){
                drawRequested=true;
                return;
            }

            lastWidth=container.clientWidth;
            lastHeight=container.clientHeight;

            const cAr=container.clientWidth/container.clientHeight;
            const vAr=viewport.width/viewport.height;


            isDrawing=true;
            drawRequested=false;
            if(!first){
                container.classList.add('hidden');
            }
            await delayAsync(110);
            const vh=viewport.height*PixelsPerInch.PDF_TO_CSS_UNITS;
            const vw=viewport.width*PixelsPerInch.PDF_TO_CSS_UNITS;
            if(cAr>vAr){
                const scale=container.clientHeight/vh
                pageView.update({scale});
                pageElem.style.transform=`translate(${(container.clientWidth-container.clientHeight*vAr)/2}px,0px)`
            }else{
                const scale=container.clientWidth/vw
                pageView.update({scale});
                pageElem.style.transform=`translate(0px,${(container.clientHeight-container.clientWidth/vAr)/2}px)`
            }
            try{
                await pageView.draw();
            }catch{
                return;
            }
            if(!first){
                await delayAsync(110);
            }
            container.classList.remove('hidden');
            isDrawing=false;
            first=false;
            if(drawRequested){
                update();
            }
        }
        const sub=ob.sizeSubject.subscribe(update);

        return ()=>{
            m=false;
            sub.unsubscribe();
            ob.dispose();
        }
    },[container,pageState,pageIndex])


    return {reader,page,ready,doc}
}

export const pdfSourceDocKey=Symbol('pdfSourceDocKey');
export const pdfSourceReaderKey=Symbol('pdfSourceReaderKey');
