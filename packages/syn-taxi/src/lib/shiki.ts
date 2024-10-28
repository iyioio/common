
import { useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import type { Highlighter, BundledLanguage as Lang } from 'shiki';
import { atDotCssGrammar } from './grammar/atDotCss';
import { convoGrammar } from './grammar/convo';
import { mdxGrammar } from './grammar/mdx';

let defaultHighlighter:Promise<Highlighter>|null;

const autoLoadMdCodeBlocksKey='autoLoadMdCodeBlocks';
const autoLoadMdCodeBlocksList=[
    'markdown',
]
interface LangInfo
{
    embeddedLangsLazy?:string[];
    [autoLoadMdCodeBlocksKey]?:boolean;
}

const loadedLangInfo:Record<string,LangInfo>={};

const loadLangMap:Record<string,Promise<boolean>>={};

const onLangLoad=new Subject<string>();

export const loadShikiLangAsync=(name:string)=>{
    return loadLangMap[name]??(loadLangMap[name]=_loadShikiLangAsync(0,name));
}

const langDeps:Record<string,string[]>={
    //mdx:['tsx'],
    //convo:['json','xml','javascript','python'],
}


const _loadShikiLangAsync=async (
    depth:number,
    name:string,
):Promise<boolean>=>{

    if(depth>10 || name==='elm' || name==='erlang'){
        return false;
    }

    const sh=await getShikiAsync();

    if(sh.getLoadedLanguages().includes(name as Lang)){
        return false;
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

    const bundledLanguages=(await import('shiki/langs')).bundledLanguages;

    const bundled=custom?[custom]:((await bundledLanguages[name as Lang]?.())?.default);

    const depList=langDeps[name];
    if(depList){
        for(const dep of depList){
            await _loadShikiLangAsync(depth+1,dep);
        }
    }

    if(bundled){
        for(const b of bundled){

            loadedLangInfo[b.name]={
                embeddedLangsLazy:b.embeddedLangsLazy,
                [autoLoadMdCodeBlocksKey]:b[autoLoadMdCodeBlocksKey] || autoLoadMdCodeBlocksList.includes(b.name),
            }

            if(b.embeddedLangs){
                for(const e of b.embeddedLangs){
                    await _loadShikiLangAsync(depth+1,e);
                }
            }
        }
    }
    return true;
}

export const supportsMdCodeBlocks=(lang:string)=>{
    return loadedLangInfo[lang]?.[autoLoadMdCodeBlocksKey]??false;
}

const codeBlockMap:Record<string,string>={
    js:'javascript',
    ts:'typescript',
    style:'atdot',
    yml:'yaml',
    sh:'shellscript',
    shell:'shellscript',
    bash:'shellscript',
    py:'python',
};
export const loadMdCodeBlocks=(lang:string,code:string):boolean=>{
    const info=loadedLangInfo[lang];
    if(!info?.[autoLoadMdCodeBlocksKey] || !info?.embeddedLangsLazy){
        return false;
    }

    let loadStarted=false;
    codeBlockReg.lastIndex=0;
    let match:RegExpMatchArray|null;
    while(match=codeBlockReg.exec(code)){
        const bl=match[2]?.toLowerCase();
        const blockLang=codeBlockMap[bl??'']??bl
        if(!blockLang || loadLangMap[blockLang] || !info.embeddedLangsLazy.includes(blockLang)){
            continue;
        }

        loadShikiLangAsync(blockLang);
        loadStarted=true;
    }

    return loadStarted;
}

const codeBlockReg=/(^|\n)```\s*([\w\-]+)/g;

export const getShikiAsync=async ():Promise<Highlighter>=>{
    if(!defaultHighlighter){
        defaultHighlighter=(async ()=>{
            const sh=await import('shiki');
            return sh.createHighlighter({
                themes:['dark-plus'],
                langs:[],
            })
        })();
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


