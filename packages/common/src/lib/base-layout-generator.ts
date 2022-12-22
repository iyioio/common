import { BaseLayoutAnimationProps, BaseLayoutFlagProps } from "./base-layout";
import { BaseLayoutCssGenerationOptions, BaseLayoutCssOptions } from "./base-layout-generator-types";
import { currentBreakpoints } from "./window-size-lib";



export const generateBaseLayoutCss=(options:BaseLayoutCssOptions):string=>{

    const {
        lines=[],
        breakpoints:bp=currentBreakpoints.value,
        filter,
        appendCss,
        lineSeparator='\n',
        ...rest
    }=options

    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        includeAnimations:true,
        ...rest
    });

    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-mobileSmUp',
        mediaQuery:`min-width:0px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-mobileUp',
        mediaQuery:`min-width:${bp.mobileSm+1}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-tabletSmUp',
        mediaQuery:`min-width:${bp.mobile+1}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-tabletUp',
        mediaQuery:`min-width:${bp.tabletSm+1}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-desktopSmUp',
        mediaQuery:`min-width:${bp.tablet+1}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-desktopUp',
        mediaQuery:`min-width:${bp.desktopSm+1}px`,
        ...rest
    });

    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-mobileSmDown',
        mediaQuery:`max-width:${bp.mobileSm}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-mobileDown',
        mediaQuery:`max-width:${bp.mobile}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-tabletSmDown',
        mediaQuery:`max-width:${bp.tabletSm}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-tabletDown',
        mediaQuery:`max-width:${bp.tablet}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-desktopSmDown',
        mediaQuery:`max-width:${bp.desktopSm}px`,
        ...rest
    });
    generateBaseLayoutBreakpointCss({
        lines,
        filter,
        classNameAppend:'-desktopDown',
        mediaQuery:`max-width:${bp.desktop}px`,
        ...rest
    });

    const addBpDisplayNone=(n:string,query:string)=>{
        if(!filter || filter[n]){
            lines.push(`@media (${query}){.io${n.substring(0,1).toUpperCase()+n.substring(1)}{display:none !important}}`)
        }
    }
    addBpDisplayNone('bpMobileSmUp',`max-width:0px`);
    addBpDisplayNone('bpMobileUp',`max-width:${bp.mobileSm}px`);
    addBpDisplayNone('bpTabletSmUp',`max-width:${bp.mobile}px`);
    addBpDisplayNone('bpTabletUp',`max-width:${bp.tabletSm}px`);
    addBpDisplayNone('bpDesktopSmUp',`max-width:${bp.tablet}px`);
    addBpDisplayNone('bpDesktopUp',`max-width:${bp.desktopSm}px`);
    addBpDisplayNone('bpMobileSmDown',`min-width:${bp.mobileSm+1}px`);
    addBpDisplayNone('bpMobileDown',`min-width:${bp.mobile+1}px`);
    addBpDisplayNone('bpTabletSmDown',`min-width:${bp.tabletSm+1}px`);
    addBpDisplayNone('bpTabletDown',`min-width:${bp.tablet+1}px`);
    addBpDisplayNone('bpDesktopSmDown',`min-width:${bp.desktopSm+1}px`);
    addBpDisplayNone('bpDesktopDown',`min-width:${bp.desktop+1}px`);

    if(appendCss){
        if(typeof appendCss === 'function'){
            appendCss(lines,options);
        }else{
            const trimmed=appendCss.trim();
            if(trimmed){
                lines.push(trimmed);
            }
        }
    }

    if(options.lines){
        return '';
    }else{
        return lines.join(lineSeparator);
    }
}


export interface BaseLayoutBreakpointOptions extends BaseLayoutCssGenerationOptions
{
    classNameAppend?:string;
    mediaQuery?:string;
    appendCss?:string|((pushTo:string[],options:BaseLayoutBreakpointOptions)=>void);
    includeAnimations?:boolean;
}

export const generateBaseLayoutBreakpointCss=(options:BaseLayoutBreakpointOptions={}):string=>
{

    const {
        spacing:{
            space0:s0='0',
            space1:s1='0.25rem',
            space2:s2='0.5rem',
            space3:s3='1rem',
            space4:s4='2rem',
            space5:s5='4rem',
            space6:s6='8rem',
        }={},
        columnWidths:{
            xs='8rem',
            sm='12rem',
            md='16rem',
            lg='24rem',
            xl='32rem',
        }={},
        animationSpeeds:{
            fast='0.1s',
            quick='0.2s',
            slow='0.5s',
            extraSlow='1.5s'
        }={},
        classNameAppend:a='',
        mediaQuery,
        filter:f,
        appendCss,
        lines:c=[],
        lineSeparator='\n',
        includeAnimations,
    }=options;

    const containerMargin=options.containerMargin??s3;

    const forCols=(n:string,p:string)=>{
        const cn='io'+n.substring(0,1).toUpperCase()+n.substring(1);
        if(!f||f[`${n}Xs${a}`])c.push(`.${cn}Xs${a}{${p}:${xs}}`)
        if(!f||f[`${n}Sm${a}`])c.push(`.${cn}Sm${a}{${p}:${sm}}`)
        if(!f||f[`${n}Md${a}`])c.push(`.${cn}Md${a}{${p}:${md}}`)
        if(!f||f[`${n}Lg${a}`])c.push(`.${cn}Lg${a}{${p}:${lg}}`)
        if(!f||f[`${n}Xl${a}`])c.push(`.${cn}Xl${a}{${p}:${xl}}`)
    }

    const forAnimation=(n:keyof BaseLayoutAnimationProps,trans:string)=>{
        const cn='io'+n.substring(0,1).toUpperCase()+n.substring(1);
        if(!f||f[`${n}-fast${a}`])c.push(`.${cn}-fast${a}{transition:${trans.replace(/_/g,fast)}}`)
        if(!f||f[`${n}${a}`])c.push(`.${cn}${a}{transition:${trans.replace(/_/g,quick)}}`)
        if(!f||f[`${n}-slow${a}`])c.push(`.${cn}-slow${a}{transition:${trans.replace(/_/g,slow)}}`)
        if(!f||f[`${n}-extraSlow${a}`])c.push(`.${cn}-extraSlow${a}{transition:${trans.replace(/_/g,extraSlow)}}`)
    }

    const forSpacings=(n:string,p:string,noEdge=false)=>{

        const cn='io'+n.substring(0,1).toUpperCase()+n.substring(1);

        if(!f||f[`${n}1${a}`])c.push(`.${cn}1${a}{${p}:${s1}}`)
        if(!f||f[`${n}2${a}`])c.push(`.${cn}2${a}{${p}:${s2}}`)
        if(!f||f[`${n}3${a}`])c.push(`.${cn}3${a}{${p}:${s3}}`)
        if(!f||f[`${n}4${a}`])c.push(`.${cn}4${a}{${p}:${s4}}`)
        if(!f||f[`${n}5${a}`])c.push(`.${cn}5${a}{${p}:${s5}}`)
        if(!f||f[`${n}6${a}`])c.push(`.${cn}6${a}{${p}:${s6}}`)
        if(!f||f[`${n}0${a}`])c.push(`.${cn}0${a}{${p}:${s0}}`)

        if(noEdge){
            return;
        }

        if(!f||f[`${n}t1${a}`])c.push(`.${cn}t1${a}{${p}-top:${s1}}`)
        if(!f||f[`${n}t2${a}`])c.push(`.${cn}t2${a}{${p}-top:${s2}}`)
        if(!f||f[`${n}t3${a}`])c.push(`.${cn}t3${a}{${p}-top:${s3}}`)
        if(!f||f[`${n}t4${a}`])c.push(`.${cn}t4${a}{${p}-top:${s4}}`)
        if(!f||f[`${n}t5${a}`])c.push(`.${cn}t5${a}{${p}-top:${s5}}`)
        if(!f||f[`${n}t6${a}`])c.push(`.${cn}t6${a}{${p}-top:${s6}}`)
        if(!f||f[`${n}t0${a}`])c.push(`.${cn}t0${a}{${p}-top:${s0}}`)

        if(!f||f[`${n}b1${a}`])c.push(`.${cn}b1${a}{${p}-bottom:${s1}}`)
        if(!f||f[`${n}b2${a}`])c.push(`.${cn}b2${a}{${p}-bottom:${s2}}`)
        if(!f||f[`${n}b3${a}`])c.push(`.${cn}b3${a}{${p}-bottom:${s3}}`)
        if(!f||f[`${n}b4${a}`])c.push(`.${cn}b4${a}{${p}-bottom:${s4}}`)
        if(!f||f[`${n}b5${a}`])c.push(`.${cn}b5${a}{${p}-bottom:${s5}}`)
        if(!f||f[`${n}b6${a}`])c.push(`.${cn}b6${a}{${p}-bottom:${s6}}`)
        if(!f||f[`${n}b0${a}`])c.push(`.${cn}b0${a}{${p}-bottom:${s0}}`)

        if(!f||f[`${n}l1${a}`])c.push(`.${cn}l1${a}{${p}-left:${s1}}`)
        if(!f||f[`${n}l2${a}`])c.push(`.${cn}l2${a}{${p}-left:${s2}}`)
        if(!f||f[`${n}l3${a}`])c.push(`.${cn}l3${a}{${p}-left:${s3}}`)
        if(!f||f[`${n}l4${a}`])c.push(`.${cn}l4${a}{${p}-left:${s4}}`)
        if(!f||f[`${n}l5${a}`])c.push(`.${cn}l5${a}{${p}-left:${s5}}`)
        if(!f||f[`${n}l6${a}`])c.push(`.${cn}l6${a}{${p}-left:${s6}}`)
        if(!f||f[`${n}l0${a}`])c.push(`.${cn}l0${a}{${p}-left:${s0}}`)

        if(!f||f[`${n}r1${a}`])c.push(`.${cn}r1${a}{${p}-right:${s1}}`)
        if(!f||f[`${n}r2${a}`])c.push(`.${cn}r2${a}{${p}-right:${s2}}`)
        if(!f||f[`${n}r3${a}`])c.push(`.${cn}r3${a}{${p}-right:${s3}}`)
        if(!f||f[`${n}r4${a}`])c.push(`.${cn}r4${a}{${p}-right:${s4}}`)
        if(!f||f[`${n}r5${a}`])c.push(`.${cn}r5${a}{${p}-right:${s5}}`)
        if(!f||f[`${n}r6${a}`])c.push(`.${cn}r6${a}{${p}-right:${s6}}`)
        if(!f||f[`${n}r0${a}`])c.push(`.${cn}r0${a}{${p}-right:${s0}}`)

        if(!f||f[`${n}v1${a}`])c.push(`.${cn}v1${a}{${p}-top:${s1};${p}-bottom:${s1}}`)
        if(!f||f[`${n}v2${a}`])c.push(`.${cn}v2${a}{${p}-top:${s2};${p}-bottom:${s2}}`)
        if(!f||f[`${n}v3${a}`])c.push(`.${cn}v3${a}{${p}-top:${s3};${p}-bottom:${s3}}`)
        if(!f||f[`${n}v4${a}`])c.push(`.${cn}v4${a}{${p}-top:${s4};${p}-bottom:${s4}}`)
        if(!f||f[`${n}v5${a}`])c.push(`.${cn}v5${a}{${p}-top:${s5};${p}-bottom:${s5}}`)
        if(!f||f[`${n}v6${a}`])c.push(`.${cn}v6${a}{${p}-top:${s6};${p}-bottom:${s6}}`)
        if(!f||f[`${n}v0${a}`])c.push(`.${cn}v0${a}{${p}-top:${s0};${p}-bottom:${s0}}`)

        if(!f||f[`${n}h1${a}`])c.push(`.${cn}h1${a}{${p}-left:${s1};${p}-right:${s1}}`)
        if(!f||f[`${n}h2${a}`])c.push(`.${cn}h2${a}{${p}-left:${s2};${p}-right:${s2}}`)
        if(!f||f[`${n}h3${a}`])c.push(`.${cn}h3${a}{${p}-left:${s3};${p}-right:${s3}}`)
        if(!f||f[`${n}h4${a}`])c.push(`.${cn}h4${a}{${p}-left:${s4};${p}-right:${s4}}`)
        if(!f||f[`${n}h5${a}`])c.push(`.${cn}h5${a}{${p}-left:${s5};${p}-right:${s5}}`)
        if(!f||f[`${n}h6${a}`])c.push(`.${cn}h6${a}{${p}-left:${s6};${p}-right:${s6}}`)
        if(!f||f[`${n}h0${a}`])c.push(`.${cn}h0${a}{${p}-left:${s0};${p}-right:${s0}}`)
    }

    const add=(n:keyof BaseLayoutFlagProps,css:string,scopedSelector?:string,scopedCss?:string)=>{
        if(!f || f[n+a]){
            const selector=`.io${n.substring(0,1).toUpperCase()+n.substring(1)}${a}`
            c.push(`${selector}{${css}}`);
            if(scopedSelector && scopedCss){
                c.push(`${selector} ${scopedSelector}{${scopedCss}}`);
            }
        }
    }

    if(mediaQuery){
        c.push(`@media (${mediaQuery}){`)
    }
    const len=c.length;

    add('listStyleNone','list-style:none;margin:0;padding:0')

    add('mCon',`margin-left:${containerMargin};margin-right:${containerMargin};`)
    add('pCon',`padding-left:${containerMargin};padding-right:${containerMargin};`)

    forSpacings('g','gap',true)
    forSpacings('p','padding')
    forSpacings('m','margin')

    forCols('col','width');
    forCols('colMin','min-width');
    forCols('colMax','max-width');

    add('displayFlex','display:flex')
    add('flexWrap','display:flex;flex-wrap:wrap')
    add('centerBoth','display:flex;justify-content:center;align-items:center')
    add('flex1','flex:1')
    add('flex2','flex:2')
    add('flex3','flex:3')
    add('flex4','flex:4')
    add('flex5','flex:5')
    add('flex6','flex:6')
    add('row','display:flex;flex-direction:row')
    add('col','display:flex;flex-direction:column')
    add('rowReverse','display:flex;flex-direction:row-reverse')
    add('colReverse','display:flex;flex-direction:column-reverse')
    add('justifyCenter','display:flex;justify-content:center')
    add('justifyStart','display:flex;justify-content:flex-start')
    add('justifyEnd','display:flex;justify-content:flex-end')
    add('justifyAround','display:flex;justify-content:space-around')
    add('justifyBetween','display:flex;justify-content:space-between')
    add('alignCenter','display:flex;align-items:center')
    add('alignStart','display:flex;align-items:flex-start')
    add('alignEnd','display:flex;align-items:flex-end')
    add('alignStretch','display:flex;align-items:stretch')
    add('selfAlignCenter','align-self:center')
    add('selfAlignStart','align-self:flex-start')
    add('selfAlignEnd','align-self:flex-end')
    add('selfAlignStretch','align-self:stretch')
    add('grid1','display:grid;grid-template-columns:1fr')
    add('grid2','display:grid;grid-template-columns:1fr 1fr')
    add('grid3','display:grid;grid-template-columns:1fr 1fr 1fr')
    add('grid4','display:grid;grid-template-columns:1fr 1fr 1fr 1fr')
    add('grid5','display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr')
    add('grid6','display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr')
    add('gridAuto1','display:grid;grid-template-columns:auto')
    add('gridAuto2','display:grid;grid-template-columns:auto auto')
    add('gridAuto3','display:grid;grid-template-columns:auto auto auto')
    add('gridAuto4','display:grid;grid-template-columns:auto auto auto auto')
    add('gridAuto5','display:grid;grid-template-columns:auto auto auto auto auto')
    add('gridAuto6','display:grid;grid-template-columns:auto auto auto auto auto auto')
    add('displayGrid','display:grid')
    add('displayInlineGrid','display:inline-grid')
    add('offScreen','position:fixed !important;left:-101vw;top:-101vh;max-width:100vw;max-height:100vh;overflow:clip;pointer-events:none')
    add('posAbs','position:absolute !important')
    add('posRel','position:relative !important')
    add('posFixed','position:fixed !important')
    add('absFill','position:absolute !important;left:0;top:0;right:0;bottom:0')
    add('absFillWh','position:absolute !important;left:0;top:0;width:100%;height:100%')
    add('wh100','width:100%;height:100%')
    add('borderBox','box-sizing:border-box')
    add('pointerEventsNone','pointer-events:none')
    add('cursorPointer','cursor:pointer')
    add('stackingRow',mediaQuery?'display:flex;flex-direction:row':'display:flex;flex-direction:column')
    add('flexGrid','display:flex;flex-wrap:wrap','> *','flex:1')
    add('displayNone','display:none !important')
    add('displayAuto','display:auto !important')
    add('overflowHidden','overflow:hidden')
    add('zIndex0','z-index:0');
    add('zIndex1','z-index:1');
    add('zIndex2','z-index:2');
    add('zIndex3','z-index:3');
    add('zIndex4','z-index:4');
    add('zIndex5','z-index:5');
    add('zIndex6','z-index:6');
    add('zIndexMax','z-index:99999');

    if(includeAnimations){
        forAnimation('transAll','all _ ease-in-out');
        forAnimation('transTransform','transform _ ease-in-out');
        forAnimation('transOpacity','opacity _ ease-in-out');
        forAnimation('transColor','color _ ease-in-out, fill _ ease-in-out');
        forAnimation('transBackgroundColor','background-color _ ease-in-out');
        forAnimation('transCommon','transform _ ease-in-out, opacity _ ease-in-out, color _ ease-in-out, fill _ ease-in-out, background-color _ ease-in-out');
    }

    if(appendCss){
        if(typeof appendCss === 'function'){
            appendCss(c,options);
        }else{
            const trimmed=appendCss.trim();
            if(trimmed){
                c.push(trimmed);
            }
        }
    }

    if(mediaQuery){
        if(c.length===len){
            c.pop();
        }else{
            c.push('}');
        }
    }

    if(options.lines){
        return '';
    }else{
        return c.join(lineSeparator);
    }
}
