
import { useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { Highlighter, BundledLanguage as Lang, createHighlighter } from 'shiki';
import { bundledLanguages } from 'shiki/langs';
import { atDotCssGrammar } from './grammar/atDotCss';
import { convoGrammar } from './grammar/convo';
import { mdxGrammar } from './grammar/mdx';

let defaultHighlighter:Promise<Highlighter>|null;

const loadLangMap:Record<string,Promise<void>>={};

const onLangLoad=new Subject<string>();
let done=false;

export const loadShikiLangAsync=(name:string)=>{
    return loadLangMap[name]??(loadLangMap[name]=_loadShikiLangAsync(0,name));
}

const langDeps:Record<string,string[]>={
    //mdx:['tsx'],
    convo:['json','xml','javascript','python'],
}

const _loadShikiLangAsync=async (
    depth:number,
    name:string,
)=>{

    if(depth>10 || name==='elm' || name==='erlang'){
        return;
    }

    const sh=await getShikiAsync();

    if(sh.getLoadedLanguages().includes(name as Lang)){
        return;
    }

    const custom:any=(name==='convo'?
        convoGrammar
    :name==='atdot'?
        atDotCssGrammar
    :name==='mdx'?
        mdxGrammar
    :
        null
    )

    try{
        await sh.loadLanguage(custom??name);
        onLangLoad.next(name);
    }catch{
        //
    }

    const bundled=custom?[custom]:((await bundledLanguages[name as Lang]?.())?.default);

    const depList=langDeps[name];
    if(depList){
        for(const dep of depList){
            await _loadShikiLangAsync(depth+1,dep);
        }
    }

    if(bundled){
        for(const b of bundled){
            if(b.embeddedLangs){
                for(const e of b.embeddedLangs){
                    await _loadShikiLangAsync(depth+1,e);
                }
            }
            if(b.embeddedLangsLazy){
                for(const e of b.embeddedLangsLazy){
                    await _loadShikiLangAsync(depth+1,e);
                }
            }
        }
    }
}

export const getShikiAsync=():Promise<Highlighter>=>{
    if(!defaultHighlighter){
        defaultHighlighter=createHighlighter({
            themes:['dark-plus'],
            langs:[],
        });
    }
    return defaultHighlighter;
}

export const useShiki=(language?:string)=>{

    const [sh,setSh]=useState<Highlighter|null>(null);
    const [loadIndex,setLoadIndex]=useState(0);


    useEffect(()=>{
        let m=true;

        getShikiAsync().then(v=>{
            if(m){
                setSh(v);
            }
        })
        return ()=>{
            m=false;
        }
    },[]);

    useEffect(()=>{
        setLoadIndex(v=>v+1);
        if(!sh || !language){
            return;
        }
        let m=true;
        loadShikiLangAsync(language).then(()=>{
            if(m){
                setLoadIndex(v=>v+1);
            }
        })
        return ()=>{
            m=false;
        }

    },[language,sh]);

    useEffect(()=>{
        let iv:any=undefined;
        let m=true;
        const sub=onLangLoad.subscribe(()=>{
            iv=setTimeout(()=>{
                clearTimeout(iv);
                if(m){
                    setLoadIndex(v=>v+1);
                }
            },100);
        })
        return ()=>{
            sub.unsubscribe();
            m=false;
        }
    },[]);

    return {sh,loadIndex};
}


