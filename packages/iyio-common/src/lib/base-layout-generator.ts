import { AllBaseLayoutProps, BaseLayoutAnimationProps, baseLayoutVarPrefix } from "./base-layout";
import { getBaseLayoutDefaults } from "./base-layout-defaults";
import { BaseLayoutCssGenerationOptions, BaseLayoutCssOptions, FontFace } from "./base-layout-generator-types";
import { currentBreakpoints } from "./window-size-lib";

const pf=baseLayoutVarPrefix;

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

export const generateFontFaceCss=(name:string):string=>(
    `font-family:var(${pf}${name}-family);color:var(${pf}${name}-color);font-size:var(${pf}${name}-size);line-height:var(${pf}${name}-lineHeight);font-weight:var(${pf}${name}-weight);font-style:var(${pf}${name}-style);font-stretch:var(${pf}${name}-stretch);font-kerning:var(${pf}${name}-kerning);text-transform:var(${pf}${name}-transform);font-variant:var(${pf}${name}-variation);letter-spacing:var(${pf}${name}-spacing);`
)
export const generateFontFaceCssVars=(name:string,f:FontFace={}):string=>(
    `${
    pf}${name}-family:${f.family??'inherit'};${
    pf}${name}-color:${f.color??'inherit'};${
    pf}${name}-size:${f.size??'inherit'};${
    pf}${name}-lineHeight:${f.lineHeight??'inherit'};${
    pf}${name}-weight:${f.weight??'inherit'};${
    pf}${name}-style:${f.style??'inherit'};${
    pf}${name}-stretch:${f.stretch??'inherit'};${
    pf}${name}-kerning:${f.kerning??'inherit'};${
    pf}${name}-transform:${f.transform??'inherit'};${
    pf}${name}-variation:${f.variation??'inherit'};${
    pf}${name}-spacing:${f.spacing??'inherit'};`
)

export const generateBaseLayoutBreakpointCss=(opts:BaseLayoutBreakpointOptions={}):string=>
{

    const options=getBaseLayoutDefaults(opts);
    const {
        spacing:{space050:obs050,space0:s0,space025:s025,space05:s05=obs050,space075:s075,space1:s1,space125:s125,space15:s15,space175:s175,space2:s2,space225:s225,space25:s25,space275:s275,space3:s3,space325:s325,space35:s35,space375:s375,space4:s4,space425:s425,space45:s45,space475:s475,space5:s5,space525:s525,space55:s55,space575:s575,space6:s6,space625:s625,space65:s65,space675:s675,space7:s7,space725:s725,space75:s75,space775:s775,space8:s8,space825:s825,space85:s85,space875:s875,space9:s9,space925:s925,space95:s95,space975:s975,space10:s10,
        },
        columnWidths:{
            columnXs:xs,
            columnSm:sm,
            columnMd:md,
            columnLg:lg,
            columnXl:xl,
        },
        animationSpeeds:{
            animationFast:fast,
            animationQuick:quick,
            animationSlow:slow,
            animationExtraSlow:extraSlow,
        },
        fontConfig:fc={},
        colors:cl={},
        classNameAppend:a='',
        mediaQuery,
        filter:f,
        appendCss,
        lines:c=[],
        lineSeparator='\n',
        includeAnimations,
        semiTransparency,
        boxSizing='border-box',
        containerMargin,
        vars,
    }=options;

    const mks=(n:string)=>{
        const b=n.substring(0,1).toUpperCase()+n.substring(1);
        if(mediaQuery){
            return `.io${b}${a}`;
        }else{
            return `.io${b}${a},.io${b}${a}--o:nth-child(odd),.io${b}${a}--e:nth-child(even),.io${b}${a}--c:first-child:first-child,.io${b}${a}--l:last-child:last-child,.io${b}${a}--d:disabled:disabled:disabled,.io${b}${a}--a:active:active:active,.io${b}${a}--f:focus:focus:focus,.io${b}${a}--h:hover:hover:hover:hover`;
        }
    }

    const forCols=(n:string,p:string)=>{
        if(!f||f[`${n}Xs${a}`])c.push(`${mks(`${n}Xs${a}`)}{${p}:${xs}}`)
        if(!f||f[`${n}Sm${a}`])c.push(`${mks(`${n}Sm${a}`)}{${p}:${sm}}`)
        if(!f||f[`${n}Md${a}`])c.push(`${mks(`${n}Md${a}`)}{${p}:${md}}`)
        if(!f||f[`${n}Lg${a}`])c.push(`${mks(`${n}Lg${a}`)}{${p}:${lg}}`)
        if(!f||f[`${n}Xl${a}`])c.push(`${mks(`${n}Xl${a}`)}{${p}:${xl}}`)
    }

    const forAnimation=(n:keyof BaseLayoutAnimationProps,trans:string)=>{
        if(!f||f[`${n}-fast${a}`])c.push(`${mks(`${n}-fast${a}`)}{transition:${trans.replace(/_/g,fast)}}`)
        if(!f||f[`${n}${a}`])c.push(`${mks(`${n}${a}`)}{transition:${trans.replace(/_/g,quick)}}`)
        if(!f||f[`${n}-slow${a}`])c.push(`${mks(`${n}-slow${a}`)}{transition:${trans.replace(/_/g,slow)}}`)
        if(!f||f[`${n}-extraSlow${a}`])c.push(`${mks(`${n}-extraSlow${a}`)}{transition:${trans.replace(/_/g,extraSlow)}}`)
    }

    const spaceNames=[
        '0I','0','050','025','05','075','1','125','15','175','2','225','25','275','3','325','35','375',
        '4','425','45','475','5','525','55','575','6','625','65','675','7','725','75','775',
        '8','825','85','875','9','925','95','975','10',
    ];
    const spaceValues=[
        s0,s0,s05,s025,s05,s075,s1,s125,s15,s175,s2,s225,s25,s275,s3,s325,s35,s375,s4,s425,s45,s475,
        s5,s525,s55,s575,s6,s625,s65,s675,s7,s725,s75,s775,s8,s825,s85,s875,s9,s925,s95,s975,s10
    ];
    /**
     * @param s side - (l,r,t,b)
     * @param slb side long before - (row-,column-)
     * @param sl side long - (-left,-right,-top,-bottom)
     * @param cn based class name - (ioM)
     * @param n short prop name - (m)
     * @param p Full prop name - (margin)
     */
    const _forS=(s:string,slb:string,sl:string,n:string,p:string)=>{
        for(let i=0;i<spaceNames.length;i++){
            if(!f||f[`${n}${s}${spaceNames[i]}${a}`])c.push(`${mks(`${n}${s}${spaceNames[i]}${a}`)}{${slb}${p}${sl}:${spaceValues[i]}${i===0?' !important':''}}`)
        }
    }
    const _forSD=(s:string,sl:string,sl2:string,n:string,p:string)=>{
        for(let i=0;i<spaceNames.length;i++){
            if(!f||f[`${n}${s}${spaceNames[i]}${a}`])c.push(`${mks(`${n}${s}${spaceNames[i]}${a}`)}{${p}${sl}:${spaceValues[i]}${i===0?' !important':''};${p}${sl2}:${spaceValues[i]}${i===0?' !important':''}}`)
        }
    }
    /**
     * @param n short prop name - (m)
     * @param p Full prop name - (margin)
     */
    const forSpacings=(n:string,p:string,rowCol=false)=>{
        _forS('','','',n,p);
        if(rowCol){
            _forS('v','row-','',n,p);
            _forS('h','column-','',n,p);
        }else{
            _forSD('v','-top','-bottom',n,p);
            _forSD('h','-left','-right',n,p);
            _forS('t','','-top',n,p);
            _forS('b','','-bottom',n,p);
            _forS('l','','-left',n,p);
            _forS('r','','-right',n,p);
        }
    }

    const addVar=(n:keyof AllBaseLayoutProps,cssProp:string,scopedSelector?:string,scopedCss?:string)=>add(n,`${cssProp}:var(${pf}${n})`,scopedSelector,scopedCss);
    const add=(n:keyof AllBaseLayoutProps,css:string,scopedSelector?:string,scopedCss?:string)=>{
        if(!css){
            return;
        }
        if(!f || f[n+a]){
            const selector=mks(n);
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
                `${mks(`${n}${a}`)},`+
                `${mks(`${nA}${a}`)}`
            )
            c.push(`${selector}{${css}}`);
            if(scopedSelector && scopedCss){
                const s2=(
                    `${mks(`${n}${a}`)} ${scopedSelector},`+
                    `${mks(`${nA}${a}`)} ${scopedSelector}`
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

        if(vars){
            for(const v of vars){
                c.push(`${v.selector??':root'}{`)
                for(const e in v.vars){
                    c.push(`--${e}:${v.vars[e]};`)
                }
                c.push('}')
            }
        }

        c.push(':root{')
        writeBaseLayoutVars(options,c)
        c.push('}')


        c.push(`.SlimButton{all:unset;display:flex;cursor:pointer}`)
        c.push(`.SlimButton[disabled]{cursor:default}`)
        c.push(`body{${generateFontFaceCss('faceDefault')}fill:var(${pf}faceDefault-color)}`)
        c.push(`a{text-decoration:${fc.linkDecoration};display:${fc.linkDisplay}}`)
        if(boxSizing){
            c.push(`*{box-sizing:${boxSizing}}`)
        }
        if(fc.normalize){
            c.push('h1,h2,h3,h4,h5,h6,p{margin:0;font-weight:400}')
        }
        c.push('.Text{display:inline-block}')
    }
    add('unsetAll',`all:unset`);
    addWithAlias('face20',fc,generateFontFaceCss('face20'))
    addWithAlias('face19',fc,generateFontFaceCss('face19'))
    addWithAlias('face18',fc,generateFontFaceCss('face18'))
    addWithAlias('face17',fc,generateFontFaceCss('face17'))
    addWithAlias('face16',fc,generateFontFaceCss('face16'))
    addWithAlias('face15',fc,generateFontFaceCss('face15'))
    addWithAlias('face14',fc,generateFontFaceCss('face14'))
    addWithAlias('face13',fc,generateFontFaceCss('face13'))
    addWithAlias('face12',fc,generateFontFaceCss('face12'))
    addWithAlias('face11',fc,generateFontFaceCss('face11'))
    addWithAlias('face10',fc,generateFontFaceCss('face10'))
    addWithAlias('face9',fc,generateFontFaceCss('face9'))
    addWithAlias('face8',fc,generateFontFaceCss('face8'))
    addWithAlias('face7',fc,generateFontFaceCss('face7'))
    addWithAlias('face6',fc,generateFontFaceCss('face6'))
    addWithAlias('face5',fc,generateFontFaceCss('face5'))
    addWithAlias('face4',fc,generateFontFaceCss('face4'))
    addWithAlias('face3',fc,generateFontFaceCss('face3'))
    addWithAlias('face2',fc,generateFontFaceCss('face2'))
    addWithAlias('face1',fc,generateFontFaceCss('face1'))
    addWithAlias('face0',fc,generateFontFaceCss('face0'))
    addWithAlias('faceDefault',fc,generateFontFaceCss('faceDefault'))
    add('xxxs',`font-size:${fc.xxxs?.size??'0.3rem'};line-height:${fc.xxxs?.lineHeight??fc.lineHeight}`)
    add('xxs',`font-size:${fc.xxs?.size??'0.5rem'};line-height:${fc.xxs?.lineHeight??fc.lineHeight}`)
    add('xs',`font-size:${fc.xs?.size??'0.7rem'};line-height:${fc.xs?.lineHeight??fc.lineHeight}`)
    add('sm',`font-size:${fc.sm?.size??'0.8rem'};line-height:${fc.sm?.lineHeight??fc.lineHeight}`)
    add('md',`font-size:${fc.md?.size??'1rem'};line-height:${fc.md?.lineHeight??fc.lineHeight}`)
    add('lg',`font-size:${fc.lg?.size??'1.5rem'};line-height:${fc.lg?.lineHeight??fc.lineHeight}`)
    add('xl',`font-size:${fc.xl?.size??'2rem'};line-height:${fc.xl?.lineHeight??fc.lineHeight}`)
    add('xxl',`font-size:${fc.xxl?.size??'4rem'};line-height:${fc.xxl?.lineHeight??fc.lineHeight}`)
    add('xxxl',`font-size:${fc.xxxl?.size??'8rem'};line-height:${fc.xxxl?.lineHeight??fc.lineHeight}`)
    add('textXxxs',`font-size:${fc.xxxs?.size??'0.3rem'};line-height:${fc.xxxs?.lineHeight??fc.lineHeight}`)
    add('textXxs',`font-size:${fc.xxs?.size??'0.5rem'};line-height:${fc.xxs?.lineHeight??fc.lineHeight}`)
    add('textXs',`font-size:${fc.xs?.size??'0.7rem'};line-height:${fc.xs?.lineHeight??fc.lineHeight}`)
    add('textSm',`font-size:${fc.sm?.size??'0.8rem'};line-height:${fc.sm?.lineHeight??fc.lineHeight}`)
    add('textMd',`font-size:${fc.md?.size??'1rem'};line-height:${fc.md?.lineHeight??fc.lineHeight}`)
    add('textLg',`font-size:${fc.lg?.size??'1.5rem'};line-height:${fc.lg?.lineHeight??fc.lineHeight}`)
    add('textXl',`font-size:${fc.xl?.size??'2rem'};line-height:${fc.xl?.lineHeight??fc.lineHeight}`)
    add('textXxl',`font-size:${fc.xxl?.size??'4rem'};line-height:${fc.xxl?.lineHeight??fc.lineHeight}`)
    add('textXxxl',`font-size:${fc.xxxl?.size??'8rem'};line-height:${fc.xxxl?.lineHeight??fc.lineHeight}`)
    addVar('weightLight','font-weight')
    addVar('weightNormal','font-weight');
    addVar('weightMedium','font-weight');
    addVar('weightBold','font-weight');
    add('weight100','font-weight:100')
    add('weight200','font-weight:200')
    add('weight300','font-weight:300')
    add('weight400','font-weight:400')
    add('weight500','font-weight:500')
    add('weight600','font-weight:600')
    add('weight700','font-weight:700')
    add('weight800','font-weight:800')
    add('centerText','text-align:center')
    add('leftText','text-align:left')// obsolete
    add('rightText','text-align:right')// obsolete
    add('preSpace','white-space:pre')
    add('whiteSpaceNormal','white-space:normal')
    add('whiteSpaceNoWrap','white-space:nowrap')
    add('whiteSpacePre','white-space:pre')
    add('whiteSpacePreWrap','white-space:pre-wrap')
    add('whiteSpacePreLine','white-space:pre-line')
    add('whiteSpaceBreakSpaces','white-space:break-spaces')
    add('textLeft','text-align:left')
    add('textCenter','text-align:center')
    add('textRight','text-align:right')
    add('textUnderline','text-decoration:underline')
    add('textOverline','text-decoration:overline')
    add('textStrike','text-decoration:line-through')
    add('textUpper','text-transform:uppercase')
    add('textLower','text-transform:lowercase')
    add('textCap','text-transform:capitalize')
    add('singleLine','text-overflow: ellipsis;overflow: hidden;white-space: nowrap')
    add('lineHeight100','line-height:1em')
    add('lineHeight125','line-height:1.25em')
    add('lineHeight150','line-height:1.5em')
    add('lineHeight175','line-height:1.75em')
    add('lineHeight200','line-height:2em')
    add('textShadowSm','text-shadow: 1px 1px 1px #00000033;')
    add('textShadowMd','text-shadow: 3px 3px 3px #00000033;')
    add('textShadowLg','text-shadow: 7px 7px 10px #00000066;')

    const bv=`var(${pf}borderWidth) var(${pf}borderStyle) var(${pf}borderColor)`
    add('border',`border:${bv}`)
    add('borderH',`border-left:${bv};border-right:${bv}`)
    add('borderV',`border-top:${bv};border-bottom:${bv}`)
    add('borderT',`border-top:${bv}`);
    add('borderB',`border-bottom:${bv}`);
    add('borderL',`border-left:${bv}`);
    add('borderR',`border-right:${bv}`);

    addVar('borderWidth','border-width');

    addVar('borderWidthSm','border-width');
    addVar('borderWidthMd','border-width');
    addVar('borderWidthLg','border-width');
    addVar('borderWidthXl','border-width');
    addVar('borderStyle',`border-style`);

    add('borderSolid',`border-style:solid`);
    add('borderDashed',`border-style:dashed`);
    add('borderDotted',`border-style:dotted`);
    add('borderDouble',`border-style:double`);

    add('borderColorPrimary',`border-color:var(${pf}colorPrimary)`)
    add('borderColorSecondary',`border-color:var(${pf}colorSecondary)`)
    add('borderColorMuted',`border-color:var(${pf}colorMuted)`)
    add('borderColorDanger',`border-color:var(${pf}colorDanger)`)
    add('borderColorSuccess',`border-color:var(${pf}colorSuccess)`)
    add('borderColorInfo',`border-color:var(${pf}colorInfo)`)
    add('borderColorWarn',`border-color:var(${pf}colorWarn)`)
    for(let i=1;i<=16;i++)add(`borderColor${i}` as any,`border-color:var(${pf}color${i})`)

    add('borderNoneI',`border:none !important`);
    add('borderNone',`border:none`);
    add('borderNoneH',`border-left:none;border-right:none`);
    add('borderNoneV',`border-top:none;border-bottom:none`);
    add('borderNoneT',`border-top:none`);
    add('borderNoneB',`border-bottom:none`);
    add('borderNoneL',`border-left:none`);
    add('borderNoneR',`border-right:none`);


    add('roundedNoneI','border-radius:0 !important');
    add('roundedNone','border-radius:0');
    add('roundedSm',`border-radius:var(${pf}roundedSm)`);
    add('roundedMd',`border-radius:var(${pf}roundedMd)`);
    add('roundedLg',`border-radius:var(${pf}roundedLg)`);
    add('rounded',`border-radius:var(${pf}rounded)`);

    add('colorWhite',`color:var(${pf}colorWhite);fill:var(${pf}colorWhite)`)
    add('colorBlack',`color:var(${pf}colorBlack);fill:var(${pf}colorBlack)`)
    add('colorGray',`color:var(${pf}colorGray);fill:var(${pf}colorGray)`)
    addWithAlias('color1',cl,`color:var(${pf}color1);fill:var(${pf}color1)`)
    addWithAlias('color2',cl,`color:var(${pf}color2);fill:var(${pf}color2)`)
    addWithAlias('color3',cl,`color:var(${pf}color3);fill:var(${pf}color3)`)
    addWithAlias('color4',cl,`color:var(${pf}color4);fill:var(${pf}color4)`)
    addWithAlias('color5',cl,`color:var(${pf}color5);fill:var(${pf}color5)`)
    addWithAlias('color6',cl,`color:var(${pf}color6);fill:var(${pf}color6)`)
    addWithAlias('color7',cl,`color:var(${pf}color7);fill:var(${pf}color7)`)
    addWithAlias('color8',cl,`color:var(${pf}color8);fill:var(${pf}color8)`)
    addWithAlias('color9',cl,`color:var(${pf}color9);fill:var(${pf}color9)`)
    addWithAlias('color10',cl,`color:var(${pf}color10);fill:var(${pf}color10)`)
    addWithAlias('color11',cl,`color:var(${pf}color11);fill:var(${pf}color11)`)
    addWithAlias('color12',cl,`color:var(${pf}color12);fill:var(${pf}color12)`)
    addWithAlias('color13',cl,`color:var(${pf}color13);fill:var(${pf}color13)`)
    addWithAlias('color14',cl,`color:var(${pf}color14);fill:var(${pf}color14)`)
    addWithAlias('color15',cl,`color:var(${pf}color15);fill:var(${pf}color15)`)
    addWithAlias('color16',cl,`color:var(${pf}color16);fill:var(${pf}color16)`)

    add('bgColorWhite',`background-color:var(${pf}bgColorWhite)`)
    add('bgColorBlack',`background-color:var(${pf}bgColorBlack)`)
    add('bgColorGray',`background-color:var(${pf}bgColorGray)`)
    addWithAlias('bgColor1',cl,`background-color:var(${pf}bgColor1)`)
    addWithAlias('bgColor2',cl,`background-color:var(${pf}bgColor2)`)
    addWithAlias('bgColor3',cl,`background-color:var(${pf}bgColor3)`)
    addWithAlias('bgColor4',cl,`background-color:var(${pf}bgColor4)`)
    addWithAlias('bgColor5',cl,`background-color:var(${pf}bgColor5)`)
    addWithAlias('bgColor6',cl,`background-color:var(${pf}bgColor6)`)
    addWithAlias('bgColor7',cl,`background-color:var(${pf}bgColor7)`)
    addWithAlias('bgColor8',cl,`background-color:var(${pf}bgColor8)`)
    addWithAlias('bgColor9',cl,`background-color:var(${pf}bgColor9)`)
    addWithAlias('bgColor10',cl,`background-color:var(${pf}bgColor10)`)
    addWithAlias('bgColor11',cl,`background-color:var(${pf}bgColor11)`)
    addWithAlias('bgColor12',cl,`background-color:var(${pf}bgColor12)`)
    addWithAlias('bgColor13',cl,`background-color:var(${pf}bgColor13)`)
    addWithAlias('bgColor14',cl,`background-color:var(${pf}bgColor14)`)
    addWithAlias('bgColor15',cl,`background-color:var(${pf}bgColor15)`)
    addWithAlias('bgColor16',cl,`background-color:var(${pf}bgColor16)`)

    add('frontColorWhite',`color:var(${pf}frontColorWhite);fill:var(${pf}frontColorWhite)`)
    add('frontColorBlack',`color:var(${pf}frontColorBlack);fill:var(${pf}frontColorBlack)`)
    add('frontColorGray',`color:var(${pf}frontColorGray);fill:var(${pf}frontColorGray)`)
    addWithAlias('frontColor1',cl,`color:var(${pf}frontColor1);fill:var(${pf}frontColor1)`)
    addWithAlias('frontColor2',cl,`color:var(${pf}frontColor2);fill:var(${pf}frontColor2)`)
    addWithAlias('frontColor3',cl,`color:var(${pf}frontColor3);fill:var(${pf}frontColor3)`)
    addWithAlias('frontColor4',cl,`color:var(${pf}frontColor4);fill:var(${pf}frontColor4)`)
    addWithAlias('frontColor5',cl,`color:var(${pf}frontColor5);fill:var(${pf}frontColor5)`)
    addWithAlias('frontColor6',cl,`color:var(${pf}frontColor6);fill:var(${pf}frontColor6)`)
    addWithAlias('frontColor7',cl,`color:var(${pf}frontColor7);fill:var(${pf}frontColor7)`)
    addWithAlias('frontColor8',cl,`color:var(${pf}frontColor8);fill:var(${pf}frontColor8)`)
    addWithAlias('frontColor9',cl,`color:var(${pf}frontColor9);fill:var(${pf}frontColor9)`)
    addWithAlias('frontColor10',cl,`color:var(${pf}frontColor10);fill:var(${pf}frontColor10)`)
    addWithAlias('frontColor11',cl,`color:var(${pf}frontColor11);fill:var(${pf}frontColor11)`)
    addWithAlias('frontColor12',cl,`color:var(${pf}frontColor12);fill:var(${pf}frontColor12)`)
    addWithAlias('frontColor13',cl,`color:var(${pf}frontColor13);fill:var(${pf}frontColor13)`)
    addWithAlias('frontColor14',cl,`color:var(${pf}frontColor14);fill:var(${pf}frontColor14)`)
    addWithAlias('frontColor15',cl,`color:var(${pf}frontColor15);fill:var(${pf}frontColor15)`)
    addWithAlias('frontColor16',cl,`color:var(${pf}frontColor16);fill:var(${pf}frontColor16)`)

    addVar('filterBlurSm','filter');
    addVar('filterBlurMd','filter');
    addVar('filterBlurLg','filter');
    add('filterBlur',`filter:var(${pf}filterBlur)`);
    addVar('filterBrightenSm','filter');
    addVar('filterBrightenMd','filter');
    addVar('filterBrightenLg','filter');
    add('filterBrighten',`filter:var(${pf}filterBrighten)`);
    addVar('filterDarkenSm','filter');
    addVar('filterDarkenMd','filter');
    addVar('filterDarkenLg','filter');
    add('filterDarken',`filter:var(${pf}filterDarken)`);
    add('filterGrayscale','filter:grayscale(100%)');
    add('filterInvert','filter:invert(100%)');

    add('listStyleNone','list-style:none;margin:0;padding:0')

    add('mCon',`margin-left:${containerMargin};margin-right:${containerMargin};`)
    add('pCon',`padding-left:${containerMargin};padding-right:${containerMargin};`)

    add('mAuto','margin:auto');
    add('mtAuto','margin-top:auto');
    add('mbAuto','margin-bottom:auto');
    add('mlAuto','margin-left:auto');
    add('mrAuto','margin-right:auto');
    add('mvAuto','margin-top:auto;margin-bottom:auto');
    add('mhAuto','margin-left:auto;margin-right:auto');

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
    add('justifyEvenly','display:flex;justify-content:space-evenly')
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
    add('gridLeftAuto2','display:grid;grid-template-columns:auto 1fr')
    add('gridLeftAuto3','display:grid;grid-template-columns:auto 1fr 1fr')
    add('gridLeftAuto4','display:grid;grid-template-columns:auto 1fr 1fr')
    add('displayGrid','display:grid')
    add('displayInlineGrid','display:inline-grid')
    add('offScreen','position:fixed !important;left:-101vw;top:-101vh;max-width:100vw;max-height:100vh;overflow:clip;pointer-events:none')
    add('posAbs','position:absolute !important')
    add('posRel','position:relative !important')
    add('posFixed','position:fixed !important')
    add('absTop','position:absolute !important;top:0;left:0;right:0')
    add('absBottom','position:absolute !important;bottom:0;left:0;right:0')
    add('absLeft','position:absolute !important;top:0;bottom:0;left:0')
    add('absRight','position:absolute !important;top:0;bottom:0;right:0')
    add('absTopLeft','position:absolute !important;top:0;left:0')
    add('absTopRight','position:absolute !important;top:0;right:0')
    add('absBottomLeft','position:absolute !important;bottom:0;left:0')
    add('absBottomRight','position:absolute !important;bottom:0;right:0')
    add('absCenter','position:absolute !important;left:50%;top:50%;transform:translate(-50%,-50%)')
    add('absRightCenter','position:absolute !important;right:0;top:50%;transform:translateY(-50%)')
    add('absLeftCenter','position:absolute !important;left:0;top:50%;transform:translateY(-50%)')
    add('absTopCenter','position:absolute !important;top:0;left:50%;transform:translateX(-50%)')
    add('absBottomCenter','position:absolute !important;bottom:0;left:50%;transform:translateX(-50%)')
    add('absFill','position:absolute !important;left:0;top:0;right:0;bottom:0')
    add('absFillWh','position:absolute !important;left:0;top:0;width:100%;height:100%')
    add('wh100','width:100%;height:100%')

    const sizes=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,24,32,40,45,48,56,64,72,80,88,96,104,112,120,128,135,136,144] as const;
    add('w100','width:100%')
    for(const s of sizes)add(`width${s}`,`width:${s}rem`)
    for(const s of sizes)add(`wMin${s}`,`min-width:${s}rem`)
    for(const s of sizes)add(`wMax${s}`,`max-width:${s}rem`)
    add('h100','height:100%')
    for(const s of sizes)add(`height${s}`,`height:${s}rem`)
    for(const s of sizes)add(`hMin${s}`,`min-height:${s}rem`)
    for(const s of sizes)add(`hMax${s}`,`max-height:${s}rem`)

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
    add('zIndexNeg1','z-index:-1')
    add('zIndexNeg2','z-index:-2')
    add('zIndexNeg3','z-index:-3')
    add('zIndexNeg4','z-index:-4')
    add('zIndexNeg5','z-index:-5')
    add('zIndexNeg6','z-index:-6')
    add('zIndexNeg7','z-index:-7')
    add('zIndexNeg8','z-index:-8')
    add('zIndexNeg9','z-index:-9')
    add('zIndexNeg10','z-index:-10')
    add('zIndexMin','z-index:-99999')
    add('zIsolate','isolation:isolate')
    add('opacity0','opacity:0')
    add('opacity025','opacity:0.25')
    add('opacity050','opacity:0.5')
    add('opacity075','opacity:0.75')
    add('opacity1','opacity:1')
    add('opacityHidden','visibility:hidden !important;opacity:0 !important')
    add('visHidden','visibility:hidden !important')
    add('visCollapsed','visibility:collapse !important')
    add('visVisible','visibility:visible !important')
    add('opacity1','opacity:1')
    add('semiTransparent',`opacity:${semiTransparency}`)

    if(includeAnimations){
        forAnimation('transAll','all _ ease-in-out');
        forAnimation('transTransform','transform _ ease-in-out');
        forAnimation('transOpacity','opacity _ ease-in-out');
        forAnimation('transColor','color _ ease-in-out, fill _ ease-in-out');
        forAnimation('transBackgroundColor','background-color _ ease-in-out');
        forAnimation('transVisibility','background-color _ ease-in-out');
        forAnimation('transCommon','transform _ ease-in-out, opacity _ ease-in-out, color _ ease-in-out, fill _ ease-in-out, background-color _ ease-in-out, visibility _ ease-in-out');
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

const skipKeys:(keyof BaseLayoutBreakpointOptions)[]=[
    'appendCss',
    'classNameAppend',
    'filter',
    'includeAnimations',
    'lineSeparator',
    'lines',
    'mediaQuery',
    'vars',
    'spacing'
]

type KeyConfigType='skip'|'mapped'|'font';
interface KeyConfig<T=any>{
    type:KeyConfigType;
}

type TypeConfig<T> = {
    [prop in keyof T]?:KeyConfig<Required<T>>;
}

type Subs={
    [prop in keyof BaseLayoutBreakpointOptions]?:TypeConfig<BaseLayoutBreakpointOptions[prop]>
}

const subConfigs:Subs={
    border:{
        borderWidth:{type:'mapped'},
        borderColor:{type:'mapped'},
    },
    rounded:{
        rounded:{type:'mapped'}
    },
    colors:{
        colorPrimary:{type:'mapped'},
        colorSecondary:{type:'mapped'},
        colorInfo:{type:'mapped'},
        colorSuccess:{type:'mapped'},
        colorDanger:{type:'mapped'},
        colorWarn:{type:'mapped'},
        colorForeground:{type:'mapped'},
        colorBorder:{type:'mapped'},
        colorMuted:{type:'mapped'},
        colorContainer:{type:'mapped'},
        colorInput:{type:'mapped'},
        bgColorPrimary:{type:'mapped'},
        bgColorSecondary:{type:'mapped'},
        bgColorInfo:{type:'mapped'},
        bgColorSuccess:{type:'mapped'},
        bgColorDanger:{type:'mapped'},
        bgColorWarn:{type:'mapped'},
        bgColorForeground:{type:'mapped'},
        bgColorBorder:{type:'mapped'},
        bgColorMuted:{type:'mapped'},
        bgColorContainer:{type:'mapped'},
        bgColorInput:{type:'mapped'},
        frontColorPrimary:{type:'mapped'},
        frontColorSecondary:{type:'mapped'},
        frontColorInfo:{type:'mapped'},
        frontColorSuccess:{type:'mapped'},
        frontColorDanger:{type:'mapped'},
        frontColorWarn:{type:'mapped'},
        frontColorForeground:{type:'mapped'},
        frontColorBorder:{type:'mapped'},
        frontColorMuted:{type:'mapped'},
        frontColorContainer:{type:'mapped'},
        frontColorInput:{type:'mapped'},
    },
    fontConfig:{
        h1:{type:'mapped'},
        h2:{type:'mapped'},
        h3:{type:'mapped'},
        h4:{type:'mapped'},
        h5:{type:'mapped'},
        h6:{type:'mapped'},
        body:{type:'mapped'},
        faceDefault:{type:'font'},
        face0:{type:'font'},
        face1:{type:'font'},
        face2:{type:'font'},
        face3:{type:'font'},
        face4:{type:'font'},
        face5:{type:'font'},
        face6:{type:'font'},
        face7:{type:'font'},
        face8:{type:'font'},
        face9:{type:'font'},
        face10:{type:'font'},
        face11:{type:'font'},
        face12:{type:'font'},
        face13:{type:'font'},
        face14:{type:'font'},
        face15:{type:'font'},
        face16:{type:'font'},
        face17:{type:'font'},
        face18:{type:'font'},
        face19:{type:'font'},
        face20:{type:'font'},
    },
    filterConfig:{
        filterBlur:{type:'mapped'},
        filterBrighten:{type:'mapped'},
        filterDarken:{type:'mapped'},
    }
};

export const writeBaseLayoutVars=(options:BaseLayoutBreakpointOptions,out:string[])=>{
    const pf=baseLayoutVarPrefix;
    for(const t in options){

        if(skipKeys.includes(t as any)){
            continue;
        }

        const value=(options as any)[t];
        if(value===undefined){
            continue;
        }

        if((typeof value === 'object') && value){
            const sub=(subConfigs as any)[t];
            for(const cp in value){
                const config:KeyConfig|undefined=sub?.[cp];
                const cv=value[cp];
                if(!config){
                    out.push(`${pf}${cp}:${cv};`);
                }else if(config.type==='mapped'){
                    out.push(`${pf}${cp}:var(${pf}${cv});`);
                }else if(config.type==='font'){
                    out.push(generateFontFaceCssVars(cp,cv));
                }


            }
        }else{
            out.push(`${pf}${t}:${value};`);
        }
    }
}
