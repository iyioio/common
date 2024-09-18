import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps, cn } from "@iyio/common";
import { LoadingDots, PageArrows, PanZoomControls, PanZoomView, Text, View, useDelayedValue, useElementSize } from "@iyio/react-common";
import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
// import { CheckboxLabel } from "../CheckboxLabel";
// import { PageArrows } from "../PageArrows";
import { VfsItem } from "@iyio/vfs";
import { PdfReader } from "./PdfReader";
import { usePdfPage } from "./pdf-hooks";

const ignoreElems=[
    'p','li','ul','ol','blockquote','pre','table','th','tr','td',
    'h1','h2','h3','h4','h5','h6',
    'a','abbr','acronym','b','bdo','big','br','button','cite','code','dfn','em','i',
    'input','kbd','label','map','output','q','samp','select','small','span',
    'strong','sub','sup','textarea','time','tt','var'
]
const panZoomIgnore=(elem:Element)=>ignoreElems.includes(elem.tagName.toLowerCase());

export interface PdfViewProps
{
    url?:string;
    source?:File|string|VfsItem;
    pageIndex?:number;
    onPageIndexChange?:(index:number)=>void;
    controls?:boolean;
    onDocChange?:(doc:PDFDocumentProxy|null)=>void;
    onPageChange?:(page:PDFPageProxy|null)=>void;
    onReaderChange?:(reader:PdfReader|null)=>void;
    onSelectionChange?:(selected:boolean[])=>void;
    onLoadedChange?:(loaded:boolean)=>void;
    selection?:boolean[];
    selectLabel?:string;
    disabled?:boolean;
    hideLoadingIndicator?:boolean;
    controlsOffset?:{x?:string,y?:string};
    disableScroll?:boolean;
    enableArrowKeys?:boolean;
}

export function PdfView({
    url,
    source=url,
    pageIndex:pageIndexProp,
    onPageIndexChange:onPageIndexChangeProp,
    onDocChange,
    onPageChange,
    onReaderChange,
    onSelectionChange,
    onLoadedChange,
    selection,
    selectLabel='Select',
    controls,
    hideLoadingIndicator,
    disabled,
    controlsOffset,
    disableScroll,
    enableArrowKeys,
    ...props
}:PdfViewProps & BaseLayoutOuterProps){

    const [_pageIndex,_setPageIndex]=useState(pageIndexProp??0);
    const pageIndex=pageIndexProp??_pageIndex;
    const onPageIndexChange=pageIndexProp===undefined?_setPageIndex:onPageIndexChangeProp;

    const [container,setContainer]=useState<HTMLDivElement|null>(null);

    const {doc,page,reader}=usePdfPage(source,pageIndex,container);

    useEffect(()=>{
        onDocChange?.(doc);
    },[doc,onDocChange]);

    useEffect(()=>{
        onPageChange?.(page);
    },[page,onPageChange]);

    useEffect(()=>{
        onReaderChange?.(reader);
    },[reader,onReaderChange]);

    const refs=useRef({onSelectionChange});
    refs.current.onSelectionChange=onSelectionChange;
    useEffect(()=>{
        if(!selection){
            return;
        }
        if(selection[pageIndex??0]===undefined){
            const sel=[...selection];
            sel[pageIndex??0]=true;
            refs.current.onSelectionChange?.(sel);
        }
    },[selection,pageIndex]);

    const isLoading=!!source && !page;
    const isLoadingDelayed=useDelayedValue(isLoading,(pageIndex??0)===0?1500:0,true,isLoading);
    const isLoadingDelayedLong=useDelayedValue(isLoading,(pageIndex??0)===0?3000:0,true,isLoading);

    useEffect(()=>{
        onLoadedChange?.(!isLoadingDelayed);
    },[isLoadingDelayed,onLoadedChange]);

    const onClick=useCallback((e:MouseEvent)=>{
        if((e.target instanceof HTMLAnchorElement) && e.target.href){
            e.preventDefault();
            window.open(e.target.href,e.target.target||'_blank');
        }
    },[]);

    const [size,setSizeElem]=useElementSize();

    return (
        <div
            className={style.root({isLoading:isLoadingDelayed},null,props)}
            style={style.vars({cx:controlsOffset?.x??'0px',cy:controlsOffset?.y??'0px'})}
        >

            {isLoadingDelayedLong && !hideLoadingIndicator && <View absFill centerBoth>
                <LoadingDots/>
            </View>}

            <div ref={setSizeElem} className="PdfView-zoomWrapper">
                <PanZoomView
                    bound
                    mode="scroll"
                    disableScroll={disableScroll}
                    ignore={panZoomIgnore}
                    minScale={1}
                    maxScale={5}
                    listenToKeys
                    disabled={disabled}
                    controls={ctrl=>(
                        <PanZoomControls
                            radius="100px"
                            className={cn("PdfView-zoom",{lower:controls})}
                            ctrl={ctrl}
                        />
                    )}
                >
                    <div className="PdfView-wrapper" onClick={onClick} style={size}>
                        <div ref={setContainer} className="PdfView-container" style={{position:'absolute'}}>
                            <div/>
                        </div>
                    </div>
                </PanZoomView>
            </div>

            {!source && <View absFill centerBoth>
                <Text opacity025 lg text="( No PDF Selected )"/>
            </View>}

            {selection && doc &&
                <View row g050>
                    {selectLabel?.replace('#',(pageIndex??0)+1+'')}
                    <input
                        type="checkbox"
                        className="PdfView-checkbox"
                        checked={selection[pageIndex??0]??true}
                        onChange={e=>{
                            const sel=[...selection];
                            sel[pageIndex??0]=e.target.checked;
                            onSelectionChange?.(sel);
                        }}
                    />
                </View>
            }
            {controls && doc && <PageArrows
                className="PdfView-arrows"
                count={doc.numPages??0}
                index={pageIndex??0}
                onChange={onPageIndexChange}
                listenToKeys={enableArrowKeys}
            />}
        </div>
    )

}

const style=atDotCss({name:'PdfView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        position:relative;
    }
    .PdfView-wrapper{
        position:relative;
        flex:1;
        transition:opacity 0.4s ease-in-out;
    }
    .PdfView-zoomWrapper{
        position:relative;
        flex:1;
        display:flex;
        flex-direction:column;
    }
    @.root.isLoading .PdfView-wrapper{
        opacity:0;
    }
    .PdfView-container{
        transition:opacity 0.1s ease-in-out;
        overflow:hidden;
        left:0;
        right:0;
        top:0;
        bottom:0;
    }
    .PdfView-container.hidden{
        opacity:0;
    }
    .PdfView-container .page{
        border-radius:10px;
        overflow:hidden;
    }

    @.root .PdfView-arrows{
        position:absolute;
        top:1rem;
        right:1rem;
        border:1px solid #ffffff22;
        transform:translate( @@cx , @@cy );
    }

    @.root .PdfView-checkbox{
        position:absolute;
        top:1rem;
        left:1rem;
        background:#00000099;
        border-radius:500px;
        padding:0.5rem 1rem;
    }

    .PdfView-zoom{
        right:1rem;
        top:1rem;
        border:1px solid #ffffff22;
        transform:translate( @@cx , @@cy );
    }
    .PdfView-zoom.lower{
        top:3.5rem;
    }

`});
