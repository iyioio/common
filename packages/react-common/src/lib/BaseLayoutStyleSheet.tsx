import { BaseLayoutCssOptions, baseLayoutIncrementalMap, currentBreakpoints, generateBaseLayoutCss, isServerSide } from '@iyio/common';
import { useEffect, useMemo } from 'react';
import Style from 'styled-jsx/style';
import { useSubject } from './rxjs-hooks';

const styleBaseId='__AoRD5JpZOl3Lg2RcD98y__';



export interface BaseLayoutStyleSheetProps extends Omit<BaseLayoutCssOptions,'lines'>
{
    optimizeForHybridRendering?:boolean;
    debugOptimizations?:boolean;
    incremental?:boolean;
    directInsert?:boolean;
}

export function BaseLayoutStyleSheet({
    optimizeForHybridRendering,
    debugOptimizations,
    incremental,
    directInsert,

    breakpoints,
    spacing,
    lineSeparator,
    appendCss,
    filter,
    columnWidths,
    animationSpeeds,
    colors,
    fontConfig,
    semiTransparency,
    boxSizing,
}:BaseLayoutStyleSheetProps){

    if(optimizeForHybridRendering){
        if(incremental===undefined){
            incremental=isServerSide;
        }
        if(directInsert===undefined){
            directInsert=!isServerSide;
        }
    }

    const _bp=useSubject(currentBreakpoints);
    const bp=breakpoints??_bp;

    if(!filter){
        filter=incremental?baseLayoutIncrementalMap:undefined;
    }

    const lines=useMemo(()=>{
        const lines:string[]=[];
        generateBaseLayoutCss({
            lines,
            breakpoints:bp,
            spacing,
            filter,
            lineSeparator,
            appendCss,
            columnWidths,
            animationSpeeds,
            colors,
            fontConfig,
            semiTransparency,
            boxSizing
        })
        return lines;
    },[bp,spacing,filter,lineSeparator,appendCss,columnWidths,animationSpeeds]);

    useEffect(()=>{
        if(!directInsert || isServerSide){
            return;
        }

        const id=`iyio-BaseLayout-direct-insert-5hbXsuqdCBVwRvFxRTYw`;

        if(globalThis.document.getElementById(id)){
            return;
        }

        const allStyles=globalThis.document.getElementsByTagName('style');
        let firstStyle:HTMLElement|null=null;
        for(let i=0;i<allStyles.length;i++){
            const style=allStyles.item(i);
            if(style?.id?.endsWith(styleBaseId)){
                style.innerHTML='';
                if(!firstStyle){
                    firstStyle=style;
                }
            }
        }

        const style=globalThis.document.createElement('style');
        style.id=id;
        style.innerHTML=lines.join('\n');
        if(firstStyle){
            globalThis.document.head.insertBefore(style,firstStyle);
        }else{
            globalThis.document.head.appendChild(style);
        }

        return ()=>{
            style.remove();
        }

    },[lines,directInsert])

    const id=`iyio-BaseLayout-${incremental?'incremental-':''}${styleBaseId}`;

    if(debugOptimizations && optimizeForHybridRendering && !directInsert){
        console.info('--- Optimized BaseLayoutStyleSheet CSS ---');
        const css=lines.join('\n')
        console.info(css.length/1000+'KB');
        console.info(css)
        console.info('------');
    }

    return (
        <Style key={id} id={id} global jsx>{directInsert?'':lines.join('\n')}</Style>
    )

}
