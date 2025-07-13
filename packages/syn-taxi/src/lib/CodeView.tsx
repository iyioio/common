import { atDotCss } from '@iyio/at-dot-css';
import { cn } from '@iyio/common';
import { useEffect, useState } from 'react';
import { useShiki } from './shiki';

interface CodeViewProps
{
    value?:string;
    wrap?:boolean;
    children?:string;
    language?:string;
    noBg?:boolean;
    className?:string;
}

/**
 * @acIgnore
 */
export function CodeView({
    value,
    wrap,
    children,
    language,
    noBg,
    className,
}:CodeViewProps){

    style.root();

    const code=value||children||'';
    const {sh,loadIndex}=useShiki(language);

    const [elem,setElem]=useState<HTMLElement|null>(null);

    useEffect(()=>{
        if(!elem || !sh){
            return;
        }
        elem.innerHTML=sh.codeToHtml(code,{lang:language?sh.getLoadedLanguages().includes(language)?language:'text':'text',theme:'dark-plus'});
        if(noBg){
            elem.querySelectorAll('pre').forEach(e=>e.style.backgroundColor='transparent')
        }

    },[sh,loadIndex,code,elem,language,noBg]);

    return (
        <pre className={cn("CodeView",className)} style={style.vars({wrap:wrap?'pre-wrap':'pre'})}><code ref={setElem}/></pre>
    )

}

const style=atDotCss({name:'CodeView',css:`
    .CodeView.pre, .CodeView > code{
        margin:0 !important;
        padding:0 !important;
        display:block !important;
        overflow-x:hidden !important;
        overflow-y:hidden !important;
        white-space:@@wrap !important;
        font-family:Courier !important;
        font-size:14px !important;
    }

`});
