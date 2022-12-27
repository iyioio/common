import { AllBaseLayoutProps, BaseLayoutAnimationProps } from "./base-layout";
import { BaseLayoutCssGenerationOptions, BaseLayoutCssOptions, FontFace } from "./base-layout-generator-types";
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

const defaultFontFaceDefault:FontFace={
    family:'Helvetica Neue, Helvetica, Arial, sans-serif',
};
export const generateFontFaceCss=(f:FontFace={}):string=>(
    `${f.family?'font-family:'+f.family+';':''}${f.size?'font-size:'+f.size+';':''}${f.color?'color:'+f.color+';':''}${f.weight?'font-weight:'+f.weight+';':''}${f.style?'font-style:'+f.style+';':''}${f.lineHeight?'line-height:'+f.lineHeight+';':''}${f.stretch?'font-stretch:'+f.stretch+';':''}${f.kerning?'font-kerning:'+f.kerning+';':''}${f.transform?'text-transform:'+f.transform+';':''}${f.variation?'font-variation:'+f.variation+';':''}${f.spacing?'letter-spacing:'+f.spacing+';':''}${f.css??''}`
)

export const generateBaseLayoutBreakpointCss=(options:BaseLayoutBreakpointOptions={}):string=>
{

    const {
        spacing:{
            space0:s0='0',
            space025:s025='0.25rem',
            space050:s050='0.50rem',
            space075:s075='0.75rem',
            space1:s1='1rem',
            space2:s2='2rem',
            space3:s3='3rem',
            space4:s4='4rem',
            space5:s5='5rem',
            space6:s6='6rem',
            space7:s7='8rem',
            space8:s8='10rem',
            space9:s9='15rem',
            space10:s10='20rem',
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
        fontConfig: fc={},
        colors: cl={},
        classNameAppend:a='',
        mediaQuery,
        filter:f,
        appendCss,
        lines:c=[],
        lineSeparator='\n',
        includeAnimations,
        semiTransparency=0.5,
        boxSizing='border-box',
    }=options;

    if(fc.normalize===undefined){fc.normalize=true}
    if(!fc.lineHeight){fc.lineHeight='1.2em'}
    if(!fc.body){fc.body='faceDefault'}
    if(!fc.h1){fc.h1='face1'}
    if(!fc.h2){fc.h2='face2'}
    if(!fc.h3){fc.h3='face3'}
    if(!fc.h4){fc.h4='face4'}
    if(!fc.h5){fc.h5='face5'}
    if(!fc.h6){fc.h6='face6'}
    if(!fc.linkDecoration){fc.linkDecoration='none'}
    if(!fc.linkDisplay){fc.linkDisplay='inline-block'}
    if(!fc.weightBold){fc.weightBold='700'}
    if(!fc.weightThin){fc.weightThin='200'}
    if(!fc.faceDefault){fc.faceDefault={...defaultFontFaceDefault}}

    if(!cl.colorPrimary){cl.colorPrimary='color1'}
    if(!cl.colorSecondary){cl.colorSecondary='color2'}
    if(!cl.colorForeground){cl.colorForeground='color10'}
    if(!cl.colorBg){cl.colorBg='color11'}
    if(!cl.colorBorder){cl.colorBorder='color12'}
    if(!cl.colorMuted){cl.colorMuted='color13'}
    if(!cl.colorContainer){cl.colorContainer='color14'}
    if(!cl.colorInput){cl.colorInput='color15'}
    if(!cl.frontColorPrimary){cl.frontColorPrimary='frontColor1'}
    if(!cl.frontColorSecondary){cl.frontColorSecondary='frontColor2'}

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

        if(!f||f[`${n}025${a}`])c.push(`.${cn}025${a}{${p}:${s025}}`)
        if(!f||f[`${n}050${a}`])c.push(`.${cn}050${a}{${p}:${s050}}`)
        if(!f||f[`${n}075${a}`])c.push(`.${cn}075${a}{${p}:${s075}}`)
        if(!f||f[`${n}1${a}`])c.push(`.${cn}1${a}{${p}:${s1}}`)
        if(!f||f[`${n}2${a}`])c.push(`.${cn}2${a}{${p}:${s2}}`)
        if(!f||f[`${n}3${a}`])c.push(`.${cn}3${a}{${p}:${s3}}`)
        if(!f||f[`${n}4${a}`])c.push(`.${cn}4${a}{${p}:${s4}}`)
        if(!f||f[`${n}5${a}`])c.push(`.${cn}5${a}{${p}:${s5}}`)
        if(!f||f[`${n}6${a}`])c.push(`.${cn}6${a}{${p}:${s6}}`)
        if(!f||f[`${n}7${a}`])c.push(`.${cn}7${a}{${p}:${s7}}`)
        if(!f||f[`${n}8${a}`])c.push(`.${cn}8${a}{${p}:${s8}}`)
        if(!f||f[`${n}9${a}`])c.push(`.${cn}9${a}{${p}:${s9}}`)
        if(!f||f[`${n}10${a}`])c.push(`.${cn}10${a}{${p}:${s10}}`)
        if(!f||f[`${n}0${a}`])c.push(`.${cn}0${a}{${p}:${s0}}`)

        if(noEdge){
            return;
        }

        if(!f||f[`${n}t025${a}`])c.push(`.${cn}t025${a}{${p}-top:${s025}}`)
        if(!f||f[`${n}t050${a}`])c.push(`.${cn}t050${a}{${p}-top:${s050}}`)
        if(!f||f[`${n}t075${a}`])c.push(`.${cn}t075${a}{${p}-top:${s075}}`)
        if(!f||f[`${n}t1${a}`])c.push(`.${cn}t1${a}{${p}-top:${s1}}`)
        if(!f||f[`${n}t2${a}`])c.push(`.${cn}t2${a}{${p}-top:${s2}}`)
        if(!f||f[`${n}t3${a}`])c.push(`.${cn}t3${a}{${p}-top:${s3}}`)
        if(!f||f[`${n}t4${a}`])c.push(`.${cn}t4${a}{${p}-top:${s4}}`)
        if(!f||f[`${n}t5${a}`])c.push(`.${cn}t5${a}{${p}-top:${s5}}`)
        if(!f||f[`${n}t6${a}`])c.push(`.${cn}t6${a}{${p}-top:${s6}}`)
        if(!f||f[`${n}t7${a}`])c.push(`.${cn}t7${a}{${p}-top:${s7}}`)
        if(!f||f[`${n}t8${a}`])c.push(`.${cn}t8${a}{${p}-top:${s8}}`)
        if(!f||f[`${n}t9${a}`])c.push(`.${cn}t9${a}{${p}-top:${s9}}`)
        if(!f||f[`${n}t10${a}`])c.push(`.${cn}t10${a}{${p}-top:${s10}}`)
        if(!f||f[`${n}t0${a}`])c.push(`.${cn}t0${a}{${p}-top:${s0}}`)

        if(!f||f[`${n}b025${a}`])c.push(`.${cn}b025${a}{${p}-bottom:${s025}}`)
        if(!f||f[`${n}b050${a}`])c.push(`.${cn}b050${a}{${p}-bottom:${s050}}`)
        if(!f||f[`${n}b075${a}`])c.push(`.${cn}b075${a}{${p}-bottom:${s075}}`)
        if(!f||f[`${n}b1${a}`])c.push(`.${cn}b1${a}{${p}-bottom:${s1}}`)
        if(!f||f[`${n}b2${a}`])c.push(`.${cn}b2${a}{${p}-bottom:${s2}}`)
        if(!f||f[`${n}b3${a}`])c.push(`.${cn}b3${a}{${p}-bottom:${s3}}`)
        if(!f||f[`${n}b4${a}`])c.push(`.${cn}b4${a}{${p}-bottom:${s4}}`)
        if(!f||f[`${n}b5${a}`])c.push(`.${cn}b5${a}{${p}-bottom:${s5}}`)
        if(!f||f[`${n}b6${a}`])c.push(`.${cn}b6${a}{${p}-bottom:${s6}}`)
        if(!f||f[`${n}b7${a}`])c.push(`.${cn}b7${a}{${p}-bottom:${s7}}`)
        if(!f||f[`${n}b8${a}`])c.push(`.${cn}b8${a}{${p}-bottom:${s8}}`)
        if(!f||f[`${n}b9${a}`])c.push(`.${cn}b9${a}{${p}-bottom:${s9}}`)
        if(!f||f[`${n}b10${a}`])c.push(`.${cn}b10${a}{${p}-bottom:${s10}}`)
        if(!f||f[`${n}b0${a}`])c.push(`.${cn}b0${a}{${p}-bottom:${s0}}`)

        if(!f||f[`${n}l025${a}`])c.push(`.${cn}l025${a}{${p}-left:${s025}}`)
        if(!f||f[`${n}l050${a}`])c.push(`.${cn}l050${a}{${p}-left:${s050}}`)
        if(!f||f[`${n}l075${a}`])c.push(`.${cn}l075${a}{${p}-left:${s075}}`)
        if(!f||f[`${n}l1${a}`])c.push(`.${cn}l1${a}{${p}-left:${s1}}`)
        if(!f||f[`${n}l2${a}`])c.push(`.${cn}l2${a}{${p}-left:${s2}}`)
        if(!f||f[`${n}l3${a}`])c.push(`.${cn}l3${a}{${p}-left:${s3}}`)
        if(!f||f[`${n}l4${a}`])c.push(`.${cn}l4${a}{${p}-left:${s4}}`)
        if(!f||f[`${n}l5${a}`])c.push(`.${cn}l5${a}{${p}-left:${s5}}`)
        if(!f||f[`${n}l6${a}`])c.push(`.${cn}l6${a}{${p}-left:${s6}}`)
        if(!f||f[`${n}l7${a}`])c.push(`.${cn}l7${a}{${p}-left:${s7}}`)
        if(!f||f[`${n}l8${a}`])c.push(`.${cn}l8${a}{${p}-left:${s8}}`)
        if(!f||f[`${n}l9${a}`])c.push(`.${cn}l9${a}{${p}-left:${s9}}`)
        if(!f||f[`${n}l10${a}`])c.push(`.${cn}l10${a}{${p}-left:${s10}}`)
        if(!f||f[`${n}l0${a}`])c.push(`.${cn}l0${a}{${p}-left:${s0}}`)

        if(!f||f[`${n}r025${a}`])c.push(`.${cn}r025${a}{${p}-right:${s025}}`)
        if(!f||f[`${n}r050${a}`])c.push(`.${cn}r050${a}{${p}-right:${s050}}`)
        if(!f||f[`${n}r075${a}`])c.push(`.${cn}r075${a}{${p}-right:${s075}}`)
        if(!f||f[`${n}r1${a}`])c.push(`.${cn}r1${a}{${p}-right:${s1}}`)
        if(!f||f[`${n}r2${a}`])c.push(`.${cn}r2${a}{${p}-right:${s2}}`)
        if(!f||f[`${n}r3${a}`])c.push(`.${cn}r3${a}{${p}-right:${s3}}`)
        if(!f||f[`${n}r4${a}`])c.push(`.${cn}r4${a}{${p}-right:${s4}}`)
        if(!f||f[`${n}r5${a}`])c.push(`.${cn}r5${a}{${p}-right:${s5}}`)
        if(!f||f[`${n}r6${a}`])c.push(`.${cn}r6${a}{${p}-right:${s6}}`)
        if(!f||f[`${n}r7${a}`])c.push(`.${cn}r7${a}{${p}-right:${s7}}`)
        if(!f||f[`${n}r8${a}`])c.push(`.${cn}r8${a}{${p}-right:${s8}}`)
        if(!f||f[`${n}r9${a}`])c.push(`.${cn}r9${a}{${p}-right:${s9}}`)
        if(!f||f[`${n}r10${a}`])c.push(`.${cn}r10${a}{${p}-right:${s10}}`)
        if(!f||f[`${n}r0${a}`])c.push(`.${cn}r0${a}{${p}-right:${s0}}`)

        if(!f||f[`${n}v025${a}`])c.push(`.${cn}v025${a}{${p}-top:${s025};${p}-bottom:${s025}}`)
        if(!f||f[`${n}v050${a}`])c.push(`.${cn}v050${a}{${p}-top:${s050};${p}-bottom:${s050}}`)
        if(!f||f[`${n}v075${a}`])c.push(`.${cn}v075${a}{${p}-top:${s075};${p}-bottom:${s075}}`)
        if(!f||f[`${n}v1${a}`])c.push(`.${cn}v1${a}{${p}-top:${s1};${p}-bottom:${s1}}`)
        if(!f||f[`${n}v2${a}`])c.push(`.${cn}v2${a}{${p}-top:${s2};${p}-bottom:${s2}}`)
        if(!f||f[`${n}v3${a}`])c.push(`.${cn}v3${a}{${p}-top:${s3};${p}-bottom:${s3}}`)
        if(!f||f[`${n}v4${a}`])c.push(`.${cn}v4${a}{${p}-top:${s4};${p}-bottom:${s4}}`)
        if(!f||f[`${n}v5${a}`])c.push(`.${cn}v5${a}{${p}-top:${s5};${p}-bottom:${s5}}`)
        if(!f||f[`${n}v6${a}`])c.push(`.${cn}v6${a}{${p}-top:${s6};${p}-bottom:${s6}}`)
        if(!f||f[`${n}v7${a}`])c.push(`.${cn}v7${a}{${p}-top:${s7};${p}-bottom:${s7}}`)
        if(!f||f[`${n}v8${a}`])c.push(`.${cn}v8${a}{${p}-top:${s8};${p}-bottom:${s8}}`)
        if(!f||f[`${n}v9${a}`])c.push(`.${cn}v9${a}{${p}-top:${s9};${p}-bottom:${s9}}`)
        if(!f||f[`${n}v10${a}`])c.push(`.${cn}v10${a}{${p}-top:${s10};${p}-bottom:${s10}}`)
        if(!f||f[`${n}v0${a}`])c.push(`.${cn}v0${a}{${p}-top:${s0};${p}-bottom:${s0}}`)

        if(!f||f[`${n}h025${a}`])c.push(`.${cn}h025${a}{${p}-left:${s025};${p}-right:${s025}}`)
        if(!f||f[`${n}h050${a}`])c.push(`.${cn}h050${a}{${p}-left:${s050};${p}-right:${s050}}`)
        if(!f||f[`${n}h075${a}`])c.push(`.${cn}h075${a}{${p}-left:${s075};${p}-right:${s075}}`)
        if(!f||f[`${n}h1${a}`])c.push(`.${cn}h1${a}{${p}-left:${s1};${p}-right:${s1}}`)
        if(!f||f[`${n}h2${a}`])c.push(`.${cn}h2${a}{${p}-left:${s2};${p}-right:${s2}}`)
        if(!f||f[`${n}h3${a}`])c.push(`.${cn}h3${a}{${p}-left:${s3};${p}-right:${s3}}`)
        if(!f||f[`${n}h4${a}`])c.push(`.${cn}h4${a}{${p}-left:${s4};${p}-right:${s4}}`)
        if(!f||f[`${n}h5${a}`])c.push(`.${cn}h5${a}{${p}-left:${s5};${p}-right:${s5}}`)
        if(!f||f[`${n}h6${a}`])c.push(`.${cn}h6${a}{${p}-left:${s6};${p}-right:${s6}}`)
        if(!f||f[`${n}h7${a}`])c.push(`.${cn}h7${a}{${p}-left:${s7};${p}-right:${s7}}`)
        if(!f||f[`${n}h8${a}`])c.push(`.${cn}h8${a}{${p}-left:${s8};${p}-right:${s8}}`)
        if(!f||f[`${n}h9${a}`])c.push(`.${cn}h9${a}{${p}-left:${s9};${p}-right:${s9}}`)
        if(!f||f[`${n}h10${a}`])c.push(`.${cn}h10${a}{${p}-left:${s10};${p}-right:${s10}}`)
        if(!f||f[`${n}h0${a}`])c.push(`.${cn}h0${a}{${p}-left:${s0};${p}-right:${s0}}`)
    }

    const add=(n:keyof AllBaseLayoutProps,css:string,scopedSelector?:string,scopedCss?:string)=>{
        if(!css){
            return;
        }
        if(!f || f[n+a]){
            const selector=`.io${n.substring(0,1).toUpperCase()+n.substring(1)}${a}`
            c.push(`${selector}{${css}}`);
            if(scopedSelector && scopedCss){
                c.push(`${selector} ${scopedSelector}{${scopedCss}}`);
            }
        }
    }

    const addWithAlias=(
        n:keyof AllBaseLayoutProps,
        objWithAlias:any,
        css:string,
        scopedSelector?:string,
        scopedCss?:string
    )=>{
        if(!css){
            return;
        }
        let nA:string|undefined;
        for(const e in objWithAlias){
            if(objWithAlias[e]===n){
                nA=e;
                break;
            }
        }

        if(!nA){
            add(n,css,scopedSelector,scopedCss);
            return;
        }

        if(!f || f[n+a] || f[nA+a]){
            const selector=(
                `.io${n.substring(0,1).toUpperCase()+n.substring(1)}${a},`+
                `.io${nA.substring(0,1).toUpperCase()+nA.substring(1)}${a}`
            )
            c.push(`${selector}{${css}}`);
            if(scopedSelector && scopedCss){
                const s2=(
                    `.io${n.substring(0,1).toUpperCase()+n.substring(1)}${a} ${scopedSelector},`+
                    `.io${nA.substring(0,1).toUpperCase()+nA.substring(1)}${a} ${scopedSelector}`
                )
                c.push(`${s2}{${scopedCss}}`);
            }
        }
    }

    if(mediaQuery){
        c.push(`@media (${mediaQuery}){`)
    }
    const len=c.length;

    if(!mediaQuery){
        c.push(`body{${generateFontFaceCss(fc.faceDefault)}}`)
        c.push(`a{text-decoration:${fc.linkDecoration};display:${fc.linkDisplay}}`)
        if(boxSizing){
            c.push(`*{box-sizing:${boxSizing}}`)
        }
        if(fc.normalize){
            c.push('h1,h2,h3,h4,h5,h6,p{margin:0;font-weight:400}')
        }
    }
    addWithAlias('face10',fc,generateFontFaceCss(fc.face10))
    addWithAlias('face9',fc,generateFontFaceCss(fc.face9))
    addWithAlias('face8',fc,generateFontFaceCss(fc.face8))
    addWithAlias('face7',fc,generateFontFaceCss(fc.face7))
    addWithAlias('face6',fc,generateFontFaceCss(fc.face6))
    addWithAlias('face5',fc,generateFontFaceCss(fc.face5))
    addWithAlias('face4',fc,generateFontFaceCss(fc.face4))
    addWithAlias('face3',fc,generateFontFaceCss(fc.face3))
    addWithAlias('face2',fc,generateFontFaceCss(fc.face2))
    addWithAlias('face1',fc,generateFontFaceCss(fc.face1))
    addWithAlias('faceDefault',fc,generateFontFaceCss(fc.faceDefault))
    add('xxxs',`font-size:${fc.xxxs?.size??'0.3rem'};line-height:${fc.xxxs?.lineHeight??fc.lineHeight}`)
    add('xxs',`font-size:${fc.xxs?.size??'0.5rem'};line-height:${fc.xxs?.lineHeight??fc.lineHeight}`)
    add('xs',`font-size:${fc.xs?.size??'0.7rem'};line-height:${fc.xs?.lineHeight??fc.lineHeight}`)
    add('sm',`font-size:${fc.sm?.size??'0.8rem'};line-height:${fc.sm?.lineHeight??fc.lineHeight}`)
    add('md',`font-size:${fc.md?.size??'1rem'};line-height:${fc.md?.lineHeight??fc.lineHeight}`)
    add('lg',`font-size:${fc.lg?.size??'1.5rem'};line-height:${fc.lg?.lineHeight??fc.lineHeight}`)
    add('xl',`font-size:${fc.xl?.size??'2rem'};line-height:${fc.xl?.lineHeight??fc.lineHeight}`)
    add('xxl',`font-size:${fc.xxl?.size??'4rem'};line-height:${fc.xxl?.lineHeight??fc.lineHeight}`)
    add('xxxl',`font-size:${fc.xxxl?.size??'8rem'};line-height:${fc.xxxl?.lineHeight??fc.lineHeight}`)
    add('weightBold',`font-weight:${fc.weightBold}`)
    add('weightThin',`font-weight:${fc.weightThin}`)
    add('centerText','text-align:center')
    add('preSpace','white-space:pre')
    add('singleLine','text-overflow: ellipsis;overflow: hidden;white-space: nowrap')
    add('lineHeight100','line-height:2em')
    add('lineHeight125','line-height:1.25em')
    add('lineHeight150','line-height:1.5em')
    add('lineHeight175','line-height:1.75em')
    add('lineHeight200','line-height:2em')

    addWithAlias('color1',cl,`color:${cl.color1};fill:${cl.color1}`)
    addWithAlias('color2',cl,`color:${cl.color2};fill:${cl.color2}`)
    addWithAlias('color3',cl,`color:${cl.color3};fill:${cl.color3}`)
    addWithAlias('color4',cl,`color:${cl.color4};fill:${cl.color4}`)
    addWithAlias('color5',cl,`color:${cl.color5};fill:${cl.color5}`)
    addWithAlias('color6',cl,`color:${cl.color6};fill:${cl.color6}`)
    addWithAlias('color7',cl,`color:${cl.color7};fill:${cl.color7}`)
    addWithAlias('color8',cl,`color:${cl.color8};fill:${cl.color8}`)
    addWithAlias('color9',cl,`color:${cl.color9};fill:${cl.color9}`)
    addWithAlias('color10',cl,`color:${cl.color10};fill:${cl.color10}`)
    addWithAlias('color11',cl,`color:${cl.color11};fill:${cl.color11}`)
    addWithAlias('color12',cl,`color:${cl.color12};fill:${cl.color12}`)
    addWithAlias('color13',cl,`color:${cl.color13};fill:${cl.color13}`)
    addWithAlias('color14',cl,`color:${cl.color14};fill:${cl.color14}`)
    addWithAlias('color15',cl,`color:${cl.color15};fill:${cl.color15}`)
    addWithAlias('color16',cl,`color:${cl.color16};fill:${cl.color16}`)
    addWithAlias('frontColor1',cl,`color:${cl.frontColor1};fill:${cl.frontColor1}`)
    addWithAlias('frontColor2',cl,`color:${cl.frontColor2};fill:${cl.frontColor2}`)
    addWithAlias('frontColor3',cl,`color:${cl.frontColor3};fill:${cl.frontColor3}`)
    addWithAlias('frontColor4',cl,`color:${cl.frontColor4};fill:${cl.frontColor4}`)
    addWithAlias('frontColor5',cl,`color:${cl.frontColor5};fill:${cl.frontColor5}`)
    addWithAlias('frontColor6',cl,`color:${cl.frontColor6};fill:${cl.frontColor6}`)
    addWithAlias('frontColor7',cl,`color:${cl.frontColor7};fill:${cl.frontColor7}`)
    addWithAlias('frontColor8',cl,`color:${cl.frontColor8};fill:${cl.frontColor8}`)
    addWithAlias('frontColor9',cl,`color:${cl.frontColor9};fill:${cl.frontColor9}`)
    addWithAlias('frontColor10',cl,`color:${cl.frontColor10};fill:${cl.frontColor10}`)
    addWithAlias('frontColor11',cl,`color:${cl.frontColor11};fill:${cl.frontColor11}`)
    addWithAlias('frontColor12',cl,`color:${cl.frontColor12};fill:${cl.frontColor12}`)
    addWithAlias('frontColor13',cl,`color:${cl.frontColor13};fill:${cl.frontColor13}`)
    addWithAlias('frontColor14',cl,`color:${cl.frontColor14};fill:${cl.frontColor14}`)
    addWithAlias('frontColor15',cl,`color:${cl.frontColor15};fill:${cl.frontColor15}`)
    addWithAlias('frontColor16',cl,`color:${cl.frontColor16};fill:${cl.frontColor16}`)

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
    add('flex7','flex:7')
    add('flex8','flex:8')
    add('flex9','flex:9')
    add('flex10','flex:10')
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
    add('grid7','display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr 1fr')
    add('grid8','display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr')
    add('grid9','display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr')
    add('grid10','display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr')
    add('gridAuto1','display:grid;grid-template-columns:auto')
    add('gridAuto2','display:grid;grid-template-columns:auto auto')
    add('gridAuto3','display:grid;grid-template-columns:auto auto auto')
    add('gridAuto4','display:grid;grid-template-columns:auto auto auto auto')
    add('gridAuto5','display:grid;grid-template-columns:auto auto auto auto auto')
    add('gridAuto6','display:grid;grid-template-columns:auto auto auto auto auto auto')
    add('gridAuto7','display:grid;grid-template-columns:auto auto auto auto auto auto auto')
    add('gridAuto8','display:grid;grid-template-columns:auto auto auto auto auto auto auto auto')
    add('gridAuto9','display:grid;grid-template-columns:auto auto auto auto auto auto auto auto auto')
    add('gridAuto10','display:grid;grid-template-columns:auto auto auto auto auto auto auto auto auto auto')
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
    add('zIndex0','z-index:0')
    add('zIndex1','z-index:1')
    add('zIndex2','z-index:2')
    add('zIndex3','z-index:3')
    add('zIndex4','z-index:4')
    add('zIndex5','z-index:5')
    add('zIndex6','z-index:6')
    add('zIndex7','z-index:7')
    add('zIndex8','z-index:8')
    add('zIndex9','z-index:9')
    add('zIndex10','z-index:10')
    add('zIndexMax','z-index:99999')
    add('opacity0','opacity:0')
    add('opacity025','opacity:0.25')
    add('opacity050','opacity:0.5')
    add('opacity075','opacity:0.75')
    add('opacity1','opacity:1')
    add('semiTransparent',`opacity:${semiTransparency}`)

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
