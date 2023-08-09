import { BaseLayoutProps, bcn } from "@iyio/common";
import { RTxtDoc, RTxtEditor, RTxtRenderOptions, RTxtRenderer } from '@iyio/rtxt';
import { useEffect, useRef, useState } from 'react';
import { useSubject } from "./rxjs-hooks";

let _editor:RTxtEditor|null=null;
const getEditor=(rendererOptions?:RTxtRenderOptions):RTxtEditor=>{
    if(!_editor){
        _editor=new RTxtEditor({renderer:rendererOptions});
    }
    return _editor;
}


export interface RichTextViewProps
{
    value?:RTxtDoc;
    initValue?:RTxtDoc;
    focus?:boolean;
    editMode?:boolean;
    rendererOptions?:RTxtRenderOptions;
    onExport?:(doc:RTxtDoc)=>void;
}

export function RichTextView({
    value,
    initValue,
    focus,
    editMode,
    rendererOptions,
    onExport,
    ...props
}:RichTextViewProps & BaseLayoutProps){

    const [elem,setElem]=useState<HTMLElement|null>(null);

    const [renderer,setRenderer]=useState<RTxtRenderer|null>(null);

    const exportDoc=useSubject(renderer?.exportDocSubject);

    useEffect(()=>{
        if(onExport && exportDoc){
            onExport(exportDoc);
        }
    },[onExport,exportDoc]);

    useEffect(()=>{
        if(!editMode || !renderer){
            return;
        }
        getEditor(renderer.options).queueRenderer(renderer);
        return ()=>{
            getEditor().dequeueRenderer(renderer);
        }
    },[editMode,renderer]);

    useEffect(()=>{
        if(renderer && focus){
            renderer.focus();
        }
    },[focus,renderer]);

    const initRef=useRef({
        initValue,
        rendererOptions
    });

    useEffect(()=>{
        if(!elem){
            setRenderer(null);
            return;
        }

        const renderer=new RTxtRenderer({
            ...initRef.current.rendererOptions,
            target:elem,
            doc:initRef.current.initValue
        });

        setRenderer(renderer);
    },[elem]);

    useEffect(()=>{
        if(renderer && focus){
            renderer.focus();
        }
    },[renderer,focus]);

    useEffect(()=>{
        if(value && renderer){
            renderer.doc=value;
            renderer.render();
        }
    },[renderer,value]);

    return (
        <div className={bcn(props,"RichTextEditorView")}>
            <div className="RichTextEditorView-content" ref={setElem}/>
        </div>
    )

}
