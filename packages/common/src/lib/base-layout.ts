import { isServerSide } from "./common-lib";
import { HashMap } from "./common-types";
import { ClassNameValue, cn } from "./css";
import { allDirectionalBreakpoints, DirectionalBreakpoint } from "./window-size-lib";


export type BaseLayoutFlagValue=boolean|DirectionalBreakpoint;

export const baseLayoutAnimationSpeeds=[
    'fast','quick','slow','extraSlow'
] as const;
Object.freeze(baseLayoutAnimationSpeeds);
export type BaseLayoutAnimationSpeed=typeof baseLayoutAnimationSpeeds[number];

export const baseLayoutAnimationProps={
    transAll:'ioTransAll',
    transTransform:'ioTransTransform',
    transOpacity:'ioTransOpacity',
    transColor:'ioTransColor',
    transBackgroundColor:'ioTransBackgroundColor',
    transCommon:'ioTransCommon'
} as const;
Object.freeze(baseLayoutAnimationProps);
export type BaseLayoutAnimationProps = {
    -readonly [prop in keyof typeof baseLayoutAnimationProps]?:boolean|BaseLayoutAnimationSpeed;
}

export const baseLayoutColumnProps={
    colXs:'ioColXs',
    colSm:'ioColSm',
    colMd:'ioColMd',
    colLg:'ioColLg',
    colXl:'ioColXl',
    colMinXs:'ioColMinXs',
    colMinSm:'ioColMinSm',
    colMinMd:'ioColMinMd',
    colMinLg:'ioColMinLg',
    colMinXl:'ioColMinXl',
    colMaxXs:'ioColMaxXs',
    colMaxSm:'ioColMaxSm',
    colMaxMd:'ioColMaxMd',
    colMaxLg:'ioColMaxLg',
    colMaxXl:'ioColMaxXl',
} as const;
Object.freeze(baseLayoutColumnProps);
export type BaseLayoutColumnProps = {
    -readonly [prop in keyof typeof baseLayoutColumnProps]?:BaseLayoutFlagValue;
}

export const baseLayoutGapProps={
    g0:'ioG0',
    g1:'ioG1',
    g2:'ioG2',
    g3:'ioG3',
    g4:'ioG4',
    g5:'ioG5',
    g6:'ioG6',
} as const;
Object.freeze(baseLayoutGapProps);
export type BaseLayoutGapProps = {
    -readonly [prop in keyof typeof baseLayoutGapProps]?:BaseLayoutFlagValue;
}

export const baseLayoutPaddingProps={
    p0:'ioP0',
    p1:'ioP1',
    p2:'ioP2',
    p3:'ioP3',
    p4:'ioP4',
    p5:'ioP5',
    p6:'ioP6',
    pl0:'ioPl0',
    pl1:'ioPl1',
    pl2:'ioPl2',
    pl3:'ioPl3',
    pl4:'ioPl4',
    pl5:'ioPl5',
    pl6:'ioPl6',
    pr0:'ioPr0',
    pr1:'ioPr1',
    pr2:'ioPr2',
    pr3:'ioPr3',
    pr4:'ioPr4',
    pr5:'ioPr5',
    pr6:'ioPr6',
    pt0:'ioPt0',
    pt1:'ioPt1',
    pt2:'ioPt2',
    pt3:'ioPt3',
    pt4:'ioPt4',
    pt5:'ioPt5',
    pt6:'ioPt6',
    pb0:'ioPb0',
    pb1:'ioPb1',
    pb2:'ioPb2',
    pb3:'ioPb3',
    pb4:'ioPb4',
    pb5:'ioPb5',
    pb6:'ioPb6',
    ph0:'ioPh0',
    ph1:'ioPh1',
    ph2:'ioPh2',
    ph3:'ioPh3',
    ph4:'ioPh4',
    ph5:'ioPh5',
    ph6:'ioPh6',
    pv0:'ioPv0',
    pv1:'ioPv1',
    pv2:'ioPv2',
    pv3:'ioPv3',
    pv4:'ioPv4',
    pv5:'ioPv5',
    pv6:'ioPv6',
    // Container margin
    pCon:'ioPCon',
} as const;
Object.freeze(baseLayoutPaddingProps);
export type BaseLayoutPaddingProps = {
    -readonly [prop in keyof typeof baseLayoutPaddingProps]?:BaseLayoutFlagValue;
}

export const baseLayoutMarginProps={
    m0:'ioM0',
    m1:'ioM1',
    m2:'ioM2',
    m3:'ioM3',
    m4:'ioM4',
    m5:'ioM5',
    m6:'ioM6',
    ml0:'ioMl0',
    ml1:'ioMl1',
    ml2:'ioMl2',
    ml3:'ioMl3',
    ml4:'ioMl4',
    ml5:'ioMl5',
    ml6:'ioMl6',
    mr0:'ioMr0',
    mr1:'ioMr1',
    mr2:'ioMr2',
    mr3:'ioMr3',
    mr4:'ioMr4',
    mr5:'ioMr5',
    mr6:'ioMr6',
    mt0:'ioMt0',
    mt1:'ioMt1',
    mt2:'ioMt2',
    mt3:'ioMt3',
    mt4:'ioMt4',
    mt5:'ioMt5',
    mt6:'ioMt6',
    mb0:'ioMb0',
    mb1:'ioMb1',
    mb2:'ioMb2',
    mb3:'ioMb3',
    mb4:'ioMb4',
    mb5:'ioMb5',
    mb6:'ioMb6',
    mh0:'ioMh0',
    mh1:'ioMh1',
    mh2:'ioMh2',
    mh3:'ioMh3',
    mh4:'ioMh4',
    mh5:'ioMh5',
    mh6:'ioMh6',
    mv0:'ioMv0',
    mv1:'ioMv1',
    mv2:'ioMv2',
    mv3:'ioMv3',
    mv4:'ioMv4',
    mv5:'ioMv5',
    mv6:'ioMv6',
    // Container margin
    mCon:'ioMCon',
} as const;
Object.freeze(baseLayoutMarginProps);
export type BaseLayoutMarginProps = {
    -readonly [prop in keyof typeof baseLayoutMarginProps]?:BaseLayoutFlagValue;
}

export const baseLayoutInnerFlexProps={
    displayFlex:'ioDisplayFlex',
    flexWrap:'ioFlexWrap',
    centerBoth:'ioCenterBoth',
    row:'ioRow',
    col:'ioCol',
    rowReverse:'ioRowReverse',
    colReverse:'ioColReverse',
    justifyCenter:'ioJustifyCenter',
    justifyStart:'ioJustifyStart',
    justifyEnd:'ioJustifyEnd',
    justifyAround:'ioJustifyAround',
    justifyBetween:'ioJustifyBetween',
    alignCenter:'ioAlignCenter',
    alignStart:'ioAlignStart',
    alignEnd:'ioAlignEnd',
    alignStretch:'ioAlignStretch',
} as const;
Object.freeze(baseLayoutInnerFlexProps);
export type BaseLayoutInnerFlexProps = {
    -readonly [prop in keyof typeof baseLayoutInnerFlexProps]?:BaseLayoutFlagValue;
}

export const baseLayoutFlexProps={
    flex1:'ioFlex1',
    flex2:'ioFlex2',
    flex3:'ioFlex3',
    flex4:'ioFlex4',
    flex5:'ioFlex5',
    flex6:'ioFlex6',
} as const;
Object.freeze(baseLayoutFlexProps);
export type BaseLayoutFlexProps = {
    -readonly [prop in keyof typeof baseLayoutFlexProps]?:BaseLayoutFlagValue;
}

export const baseLayoutSelfFlexProps={
    selfAlignCenter:'ioSelfAlignCenter',
    selfAlignStart:'ioSelfAlignStart',
    selfAlignEnd:'ioSelfAlignEnd',
    selfAlignStretch:'ioSelfAlignStretch',
} as const;
Object.freeze(baseLayoutSelfFlexProps);
export type BaseLayoutSelfFlexProps = {
    -readonly [prop in keyof typeof baseLayoutSelfFlexProps]?:BaseLayoutFlagValue;
}

export const baseLayoutInnerGridProps={
    displayGrid:'ioDisplayGrid',
    displayInlineGrid:'ioDisplayInlineGrid',
    grid1:'ioGrid1',
    grid2:'ioGrid2',
    grid3:'ioGrid3',
    grid4:'ioGrid4',
    grid5:'ioGrid5',
    grid6:'ioGrid6',
    gridAuto1:'ioGridAuto1',
    gridAuto2:'ioGridAuto2',
    gridAuto3:'ioGridAuto3',
    gridAuto4:'ioGridAuto4',
    gridAuto5:'ioGridAuto5',
    gridAuto6:'ioGridAuto6',

} as const;
Object.freeze(baseLayoutInnerGridProps);
export type BaseLayoutInnerGridProps = {
    -readonly [prop in keyof typeof baseLayoutInnerGridProps]?:BaseLayoutFlagValue;
}

export const baseLayoutParentLayoutProps={
    stackingRow:'ioStackingRow',
    flexGrid:'ioFlexGrid',
}
Object.freeze(baseLayoutParentLayoutProps);
export type BaseLayoutParentLayoutProps = {
    -readonly [prop in keyof typeof baseLayoutParentLayoutProps]?:BaseLayoutFlagValue;
}

export const baseLayoutBreakpointProps={
    bpMobileSmUp:'ioBpMobileSmUp',
    bpMobileUp:'ioBpMobileUp',
    bpTabletSmUp:'ioBpTabletSmUp',
    bpTabletUp:'ioBpTabletUp',
    bpDesktopSmUp:'ioBpDesktopSmUp',
    bpDesktopUp:'ioBpDesktopUp',
    bpMobileSmDown:'ioBpMobileSmDown',
    bpMobileDown:'ioBpMobileDown',
    bpTabletSmDown:'ioBpTabletSmDown',
    bpTabletDown:'ioBpTabletDown',
    bpDesktopSmDown:'ioBpDesktopSmDown',
    bpDesktopDown:'ioBpDesktopDown',

} as const;
Object.freeze(baseLayoutBreakpointProps);
export type BaseLayoutBreakpointProps = {
    -readonly [prop in keyof typeof baseLayoutBreakpointProps]?:boolean;
}

export const baseLayoutUtilProps={
    offScreen:'ioOffScreen',
    posAbs:'ioPosAbs',
    posRel:'ioPosRel',
    posFixed:'ioPosFixed',
    absFill:'ioAbsFill',
    absFillWh:'ioAbsFillWh',
    wh100:'ioWh100',
    borderBox:'ioBorderBox',
    pointerEventsNone:'ioPointerEventsNone',
    cursorPointer:'ioCursorPointer',
    displayNone:'ioDisplayNone',
    displayAuto:'ioDisplayAuto',
    listStyleNone:'ioListStyleNone',
    overflowHidden:'ioOverflowHidden',
    zIndex0:'ioZIndex0',
    zIndex1:'ioZIndex1',
    zIndex2:'ioZIndex2',
    zIndex3:'ioZIndex3',
    zIndex4:'ioZIndex4',
    zIndex5:'ioZIndex5',
    zIndex6:'ioZIndex6',
    zIndexMax:'ioZIndexMax',

} as const;
Object.freeze(baseLayoutUtilProps);
export type BaseLayoutUtilProps = {
    -readonly [prop in keyof typeof baseLayoutUtilProps]?:BaseLayoutFlagValue;
}

export const baseLayoutFlagProps={
    ...baseLayoutPaddingProps,
    ...baseLayoutMarginProps,
    ...baseLayoutColumnProps,
    ...baseLayoutFlexProps,
    ...baseLayoutInnerFlexProps,
    ...baseLayoutSelfFlexProps,
    ...baseLayoutGapProps,
    ...baseLayoutInnerGridProps,
    ...baseLayoutParentLayoutProps,
    ...baseLayoutBreakpointProps,
    ...baseLayoutUtilProps,
} as const;
Object.freeze(baseLayoutFlagProps);
export type BaseLayoutFlagProps = {
    -readonly [prop in keyof typeof baseLayoutFlagProps]?:BaseLayoutFlagValue;
}

const allMap={
    ...baseLayoutFlagProps,
    ...baseLayoutAnimationProps
}

export const allBaseLayoutFlagProps:(keyof BaseLayoutFlagProps)[]=[];
for(const e in baseLayoutFlagProps){
    allBaseLayoutFlagProps.push(e as any);
}
Object.freeze(allBaseLayoutFlagProps);

export interface BaseLayoutClassNameProps
{
    className?:string;
}


export type BaseLayoutInnerProps =
    BaseLayoutAnimationProps &
    BaseLayoutPaddingProps &
    BaseLayoutGapProps &
    BaseLayoutInnerFlexProps &
    BaseLayoutClassNameProps &
    BaseLayoutParentLayoutProps &
    BaseLayoutBreakpointProps &
    BaseLayoutUtilProps;

export type BaseLayoutOuterNoFlexProps =
    BaseLayoutAnimationProps &
    BaseLayoutMarginProps &
    BaseLayoutSelfFlexProps &
    BaseLayoutClassNameProps &
    BaseLayoutBreakpointProps &
    BaseLayoutUtilProps &
    BaseLayoutColumnProps;

export type BaseLayoutOuterProps =
    BaseLayoutOuterNoFlexProps &
    BaseLayoutFlexProps &
    BaseLayoutAnimationProps &
    BaseLayoutColumnProps;

export type BaseLayoutProps =
    BaseLayoutAnimationProps &
    BaseLayoutFlagProps &
    BaseLayoutClassNameProps;


let incremental=isServerSide;
export const setBaseLayoutClassesIncremental=(isIncremental:boolean)=>{
    incremental=isIncremental;
}

export const baseLayoutIncrementalMap:HashMap<boolean>={}

export const baseLayoutCn=(props:Partial<BaseLayoutProps>):string|undefined=>
{
    if(!props){
        return undefined;
    }
    let classNames:string|undefined;
    let cn:string;
    for(const e in props){
        const v=(props as any)[e];
        if(
            (
                v===true ||
                allDirectionalBreakpoints.includes(v as any) ||
                ((baseLayoutAnimationSpeeds.includes(v as any) && (baseLayoutAnimationProps as any)[e]))
            ) &&
            (cn=(allMap as any)[e]))
        {
            if(incremental){
                baseLayoutIncrementalMap[e+(v===true?'':'-'+v)]=true;
            }
            classNames=(classNames?classNames+' ':'')+cn+(v===true?'':'-'+v);
        }
    }
    if(props["className"]){
        classNames=(classNames?classNames+' ':'')+props["className"];
    }
    return classNames;
}

export const bcn=(
    props:Partial<BaseLayoutProps>,
    ...classNames:ClassNameValue[]
):string|undefined=>{
    if(classNames.length){
        if(classNames.length===1){
            return cn(classNames[0],baseLayoutCn(props));
        }else if(classNames.length===2){
            return cn(classNames[0],classNames[1],baseLayoutCn(props));
        }else if(classNames.length===3){
            return cn(classNames[0],classNames[1],classNames[3],baseLayoutCn(props));
        }else{
            return cn(...classNames,baseLayoutCn(props));
        }
    }else{
        return baseLayoutCn(props);
    }
}
