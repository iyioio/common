
export const baseLayoutGapProps={
    g0:'iy-g0',
    g1:'iy-g1',
    g2:'iy-g2',
    g3:'iy-g3',
    g4:'iy-g4',
    g5:'iy-g5',
    g6:'iy-g6',
} as const;
Object.freeze(baseLayoutGapProps);
export type BaseLayoutGapProps = {
    -readonly [prop in keyof typeof baseLayoutGapProps]?:boolean;
}

export const baseLayoutPaddingProps={
    p0:'iy-p0',
    p1:'iy-p1',
    p2:'iy-p2',
    p3:'iy-p3',
    p4:'iy-p4',
    p5:'iy-p5',
    p6:'iy-p6',
    pl0:'iy-pl0',
    pl1:'iy-pl1',
    pl2:'iy-pl2',
    pl3:'iy-pl3',
    pl4:'iy-pl4',
    pl5:'iy-pl5',
    pl6:'iy-pl6',
    pr0:'iy-pr0',
    pr1:'iy-pr1',
    pr2:'iy-pr2',
    pr3:'iy-pr3',
    pr4:'iy-pr4',
    pr5:'iy-pr5',
    pr6:'iy-pr6',
    pt0:'iy-pt0',
    pt1:'iy-pt1',
    pt2:'iy-pt2',
    pt3:'iy-pt3',
    pt4:'iy-pt4',
    pt5:'iy-pt5',
    pt6:'iy-pt6',
    pb0:'iy-pb0',
    pb1:'iy-pb1',
    pb2:'iy-pb2',
    pb3:'iy-pb3',
    pb4:'iy-pb4',
    pb5:'iy-pb5',
    pb6:'iy-pb6',
    ph0:'iy-ph0',
    ph1:'iy-ph1',
    ph2:'iy-ph2',
    ph3:'iy-ph3',
    ph4:'iy-ph4',
    ph5:'iy-ph5',
    ph6:'iy-ph6',
    pv0:'iy-pv0',
    pv1:'iy-pv1',
    pv2:'iy-pv2',
    pv3:'iy-pv3',
    pv4:'iy-pv4',
    pv5:'iy-pv5',
    pv6:'iy-pv6',
} as const;
Object.freeze(baseLayoutPaddingProps);
export type BaseLayoutPaddingProps = {
    -readonly [prop in keyof typeof baseLayoutPaddingProps]?:boolean;
}

export const baseLayoutMarginProps={
    m0:'iy-m0',
    m1:'iy-m1',
    m2:'iy-m2',
    m3:'iy-m3',
    m4:'iy-m4',
    m5:'iy-m5',
    m6:'iy-m6',
    ml0:'iy-ml0',
    ml1:'iy-ml1',
    ml2:'iy-ml2',
    ml3:'iy-ml3',
    ml4:'iy-ml4',
    ml5:'iy-ml5',
    ml6:'iy-ml6',
    mr0:'iy-mr0',
    mr1:'iy-mr1',
    mr2:'iy-mr2',
    mr3:'iy-mr3',
    mr4:'iy-mr4',
    mr5:'iy-mr5',
    mr6:'iy-mr6',
    mt0:'iy-mt0',
    mt1:'iy-mt1',
    mt2:'iy-mt2',
    mt3:'iy-mt3',
    mt4:'iy-mt4',
    mt5:'iy-mt5',
    mt6:'iy-mt6',
    mb0:'iy-mb0',
    mb1:'iy-mb1',
    mb2:'iy-mb2',
    mb3:'iy-mb3',
    mb4:'iy-mb4',
    mb5:'iy-mb5',
    mb6:'iy-mb6',
    mh0:'iy-mh0',
    mh1:'iy-mh1',
    mh2:'iy-mh2',
    mh3:'iy-mh3',
    mh4:'iy-mh4',
    mh5:'iy-mh5',
    mh6:'iy-mh6',
    mv0:'iy-mv0',
    mv1:'iy-mv1',
    mv2:'iy-mv2',
    mv3:'iy-mv3',
    mv4:'iy-mv4',
    mv5:'iy-mv5',
    mv6:'iy-mv6',
} as const;
Object.freeze(baseLayoutMarginProps);
export type BaseLayoutMarginProps = {
    -readonly [prop in keyof typeof baseLayoutMarginProps]?:boolean;
}

export const baseLayoutFlexProps={
    displayFlex:'iy-displayFlex',
    flexWrap:'iy-flexWrap',
    centerBoth:'iy-centerBoth',
    flex1:'iy-flex1',
    flex2:'iy-flex2',
    flex3:'iy-flex3',
    flex4:'iy-flex4',
    flex5:'iy-flex5',
    row:'iy-row',
    col:'iy-col',
    rowReverse:'iy-rowReverse',
    colReverse:'iy-colReverse',
    justifyCenter:'iy-justifyCenter',
    justifyStart:'iy-justifyStart',
    justifyEnd:'iy-justifyEnd',
    justifyAround:'iy-justifyAround',
    justifyBetween:'iy-justifyBetween',
    alignCenter:'iy-alignCenter',
    alignStart:'iy-alignStart',
    alignEnd:'iy-alignEnd',
    alignStretch:'iy-alignStretch',
    selfAlignCenter:'iy-selfAlignCenter',
    selfAlignStart:'iy-selfAlignStart',
    selfAlignEnd:'iy-selfAlignEnd',
    selfAlignStretch:'iy-selfAlignStretch',
} as const;
Object.freeze(baseLayoutFlexProps);
export type BaseLayoutFlexProps = {
    -readonly [prop in keyof typeof baseLayoutFlexProps]?:boolean;
}

export const baseLayoutFlagProps={
    ...baseLayoutPaddingProps,
    ...baseLayoutMarginProps,
    ...baseLayoutFlexProps,
    ...baseLayoutGapProps,
} as const;
Object.freeze(baseLayoutFlagProps);
export type BaseLayoutFlagProps = {
    -readonly [prop in keyof typeof baseLayoutFlagProps]?:boolean;
}

export const allBaseLayoutFlagProps:(keyof BaseLayoutFlagProps)[]=[];
for(const e in baseLayoutFlagProps){
    allBaseLayoutFlagProps.push(e as any);
}
Object.freeze(allBaseLayoutFlagProps);


export type BaseLayoutProps = BaseLayoutFlagProps & {
    className?:string;
}

export const baseLayoutCn=(props:Partial<BaseLayoutProps>):string|undefined=>
{
    if(!props){
        return undefined;
    }
    let classNames:string|undefined;
    let cn:string;
    for(const e in props){
        if((props as any)[e]===true && (cn=(baseLayoutFlagProps as any)[e])){
            classNames=(classNames?classNames+' ':'')+cn;
        }
    }
    if(props["className"]){
        classNames=(classNames?classNames+' ':'')+props["className"];
    }
    return classNames;
}
