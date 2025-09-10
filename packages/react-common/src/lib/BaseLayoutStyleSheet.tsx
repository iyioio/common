import { BaseLayoutCssOptions, baseLayoutIncrementalMap, currentBreakpoints, generateBaseLayoutCss, isServerSide, styleSheetRenderer } from '@iyio/common';
import { useMemo } from 'react';
import { useSubject } from './rxjs-hooks.js';

const sheetId=`iyio-common-BaseLayout`;

export interface BaseLayoutStyleSheetProps extends Omit<BaseLayoutCssOptions,'lines'>
{
    optimizeForHybridRendering?:boolean;
    debugOptimizations?:boolean;
    incremental?:boolean;
    directInsert?:boolean;
}

/**
 * @acIgnore
 */
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
    vars,
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
            boxSizing,
            vars,
        })

        const id=sheetId;
        const renderer=styleSheetRenderer();
        renderer.removeSheet(id);
        renderer.addSheet({
            id:id,
            order:'base',
            css:lines.join('\n'),
        })

        return lines;
    },[
        bp,
        spacing,
        filter,
        lineSeparator,
        appendCss,
        columnWidths,
        animationSpeeds,
        boxSizing,
        fontConfig,
        colors,
        semiTransparency,
        vars,
    ]);


    if(debugOptimizations && optimizeForHybridRendering && !directInsert){
        console.info('--- Optimized BaseLayoutStyleSheet CSS ---');
        const css=lines.join('\n')
        console.info(css.length/1000+'KB');
        console.info(css)
        console.info('------');
    }

    return (
        null
    )

}
