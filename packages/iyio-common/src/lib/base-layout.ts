import { isServerSide } from "./common-lib";
import { HashMap } from "./common-types";
import { ClassNameValue, cn } from "./css";
import { DirectionalBreakpoint, DirectionalBreakpointAlias, allDirectionalBreakpointAliases, allDirectionalBreakpoints, currentDirectionalBreakpointAliases } from "./window-size-lib";

export const baseLayoutVarPrefix='--io-'

const allBaseLayoutModifiersMap    =['h',    'a',     'f',    'd',       'c',    'l',   'o',  'e'];
export const allBaseLayoutModifiers=['hover','active','focus','disabled','first','last','odd','even'] as const;
export type BaseLayoutModifier=typeof allBaseLayoutModifiers[number];
export type BaseLayoutFlagValue=boolean|DirectionalBreakpoint|DirectionalBreakpointAlias|BaseLayoutModifier;
export type BaseLayoutFlagValues=BaseLayoutFlagValue|BaseLayoutFlagValue[];
export type BaseLayoutSpeedFlagValue=boolean|BaseLayoutAnimationSpeed;

export const baseLayoutAnimationSpeeds=[
    'fast','quick','slow','extraSlow'
] as const;
Object.freeze(baseLayoutAnimationSpeeds);
export type BaseLayoutAnimationSpeed=typeof baseLayoutAnimationSpeeds[number];

/**
 * @acGroup animation
 */
export const baseLayoutAnimationProps={
    transAll:'ioTransAll',
    transTransform:'ioTransTransform',
    transOpacity:'ioTransOpacity',
    transColor:'ioTransColor',
    transBackgroundColor:'ioTransBackgroundColor',
    transVisibility:'ioTransVisibility',
    transCommon:'ioTransCommon'
} as const;
Object.freeze(baseLayoutAnimationProps);
export type BaseLayoutAnimationProps = {
    -readonly [prop in keyof typeof baseLayoutAnimationProps]?:BaseLayoutSpeedFlagValue;
}
/**
 * @acGroup column
 */
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
    -readonly [prop in keyof typeof baseLayoutColumnProps]?:BaseLayoutFlagValues;
}

export const baseLayoutTextOnlyFontProps={
    body:'ioBody',//mapped - faceDefault
    h1:'ioH1',//mapped - face1
    h2:'ioH2',//mapped - face2
    h3:'ioH3',//mapped - face3
    h4:'ioH4',//mapped - face4
    h5:'ioH5',//mapped - face5
    h6:'ioH6',//mapped - face6
    xxxs:'ioXxxs',// obsolete
    xxs:'ioXxs',// obsolete
    xs:'ioXs',// obsolete
    sm:'ioSm',// obsolete
    md:'ioMd',// obsolete
    lg:'ioLg',// obsolete
    xl:'ioXl',// obsolete
    xxl:'ioXxl',// obsolete
    xxxl:'ioXxxl',// obsolete
    preSpace:'ioPreSpace',//obsolete
} as const;
Object.freeze(baseLayoutTextOnlyFontProps);
export type BaseLayoutTextOnlyFontProps = {
    -readonly [prop in keyof typeof baseLayoutTextOnlyFontProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup text
 */
export const baseLayoutFontProps={
    centerText:'ioCenterText',// obsolete
    leftText:'ioLeftText',// obsolete
    rightText:'ioRightText',// obsolete

    faceDefault:'ioFaceDefault',
    face0:'ioFace0',
    face1:'ioFace1',
    face2:'ioFace2',
    face3:'ioFace3',
    face4:'ioFace4',
    face5:'ioFace5',
    face6:'ioFace6',
    face7:'ioFace7',
    face8:'ioFace8',
    face9:'ioFace9',
    face10:'ioFace10',
    face11:'ioFace11',
    face12:'ioFace12',
    face13:'ioFace13',
    face14:'ioFace14',
    face15:'ioFace15',
    face16:'ioFace16',
    face17:'ioFace17',
    face18:'ioFace18',
    face19:'ioFace19',
    face20:'ioFace20',
    weightLight:'ioWeightLight',//mapped weight300
    weightNormal:'ioWeightNormal',//mapped weight400
    weightMedium:'ioWeightMedium',//mapped weight500
    weightBold:'ioWeightBold',//mapped weight700
    weight100:'ioWeight100',
    weight200:'ioWeight200',
    weight300:'ioWeight300',
    weight400:'ioWeight400',
    weight500:'ioWeight500',
    weight600:'ioWeight600',
    weight700:'ioWeight700',
    weight800:'ioWeight800',
    whiteSpaceNormal:'ioWhiteSpaceNormal',
    whiteSpaceNoWrap:'ioWhiteSpaceNoWrap',
    whiteSpacePre:'ioWhiteSpacePre',
    whiteSpacePreWrap:'ioWhiteSpacePreWrap',
    whiteSpacePreLine:'ioWhiteSpacePreLine',
    whiteSpaceBreakSpaces:'ioWhiteSpaceBreakSpaces',
    singleLine:'ioSingleLine',
    textLeft:'ioTextLeft',
    textCenter:'ioTextCenter',
    textRight:'ioTextRight',
    textUnderline:'ioTextUnderline',
    textOverline:'ioTextOverline',
    textStrike:'ioTextStrike',
    textUpper:'ioTextUpper',
    textLower:'ioTextLower',
    textCap:'ioTextCap',
    textXxxs:'ioTextXxxs',
    textXxs:'ioTextXxs',
    textXs:'ioTextXs',
    textSm:'ioTextSm',
    textMd:'ioTextMd',
    textLg:'ioTextLg',
    textXl:'ioTextXl',
    textXxl:'ioTextXxl',
    textXxxl:'ioTextXxxl',
    lineHeight100:'ioLineHeight100',
    lineHeight125:'ioLineHeight125',
    lineHeight150:'ioLineHeight150',
    lineHeight175:'ioLineHeight175',
    lineHeight200:'ioLineHeight200',
    textShadowSm:'ioTextShadowSm',
    textShadowMd:'ioTextShadowMd',
    textShadowLg:'ioTextShadowLg',

} as const;
Object.freeze(baseLayoutFontProps);
export type BaseLayoutFontProps = {
    -readonly [prop in keyof typeof baseLayoutFontProps]?:BaseLayoutFlagValues;
}
/**
 * @acGroup colors
 */
export const baseLayoutColorBaseProps={
    colorWhite:'ioColorWhite',
    colorBlack:'ioColorBlack',
    colorGray:'ioColorGray',
    color1:'ioColor1',
    color2:'ioColor2',
    color3:'ioColor3',
    color4:'ioColor4',
    color5:'ioColor5',
    color6:'ioColor6',
    color7:'ioColor7',
    color8:'ioColor8',
    color9:'ioColor9',
    color10:'ioColor10',
    color11:'ioColor11',
    color12:'ioColor12',
    color13:'ioColor13',
    color14:'ioColor14',
    color15:'ioColor15',
    color16:'ioColor16',
    bgColorWhite:'ioBgColorWhite',
    bgColorBlack:'ioBgColorBlack',
    bgColorGray:'ioBgColorGray',
    bgColor1:'ioBgColor1',
    bgColor2:'ioBgColor2',
    bgColor3:'ioBgColor3',
    bgColor4:'ioBgColor4',
    bgColor5:'ioBgColor5',
    bgColor6:'ioBgColor6',
    bgColor7:'ioBgColor7',
    bgColor8:'ioBgColor8',
    bgColor9:'ioBgColor9',
    bgColor10:'ioBgColor10',
    bgColor11:'ioBgColor11',
    bgColor12:'ioBgColor12',
    bgColor13:'ioBgColor13',
    bgColor14:'ioBgColor14',
    bgColor15:'ioBgColor15',
    bgColor16:'ioBgColor16',
    frontColorWhite:'ioFrontColorWhite',
    frontColorBlack:'ioFrontColorBlack',
    frontColorGray:'ioFrontColorGray',
    frontColor1:'ioFrontColor1',
    frontColor2:'ioFrontColor2',
    frontColor3:'ioFrontColor3',
    frontColor4:'ioFrontColor4',
    frontColor5:'ioFrontColor5',
    frontColor6:'ioFrontColor6',
    frontColor7:'ioFrontColor7',
    frontColor8:'ioFrontColor8',
    frontColor9:'ioFrontColor9',
    frontColor10:'ioFrontColor10',
    frontColor11:'ioFrontColor11',
    frontColor12:'ioFrontColor12',
    frontColor13:'ioFrontColor13',
    frontColor14:'ioFrontColor14',
    frontColor15:'ioFrontColor15',
    frontColor16:'ioFrontColor16',
} as const;
Object.freeze(baseLayoutColorBaseProps);

/**
 * @acGroup colorMap
 */
export const baseLayoutColorMappedProps={
    colorPrimary:'ioColorPrimary',//mapped color1
    colorSecondary:'ioColorSecondary',//mapped color2
    colorInfo:'ioColorInfo',// mapped - color6
    colorSuccess:'ioColorSuccess',// mapped - color7
    colorWarn:'ioColorWarn',// mapped - color8
    colorDanger:'ioColorDanger',// mapped - color9
    colorForeground:'ioColorForeground',// mapped - color10
    colorBg:'ioColorBg',// mapped - color11
    colorBorder:'ioColorBorder',// mapped - color12
    colorMuted:'ioColorMuted',// mapped - color13
    colorContainer:'ioColorContainer',// mapped - color14
    colorInput:'ioColorInput',// mapped - color15
    bgColorPrimary:'ioBgColorPrimary',//mapped color1
    bgColorSecondary:'ioBgColorSecondary',//mapped color2
    bgColorInfo:'ioBgColorInfo',// mapped - color6
    bgColorSuccess:'ioBgColorSuccess',// mapped - color7
    bgColorWarn:'ioBgColorWarn',// mapped - color8
    bgColorDanger:'ioBgColorDanger',// mapped - color9
    bgColorForeground:'ioBgColorForeground',// mapped - color10
    bgColorBg:'ioBgColorBg',// mapped - color11
    bgColorBorder:'ioBgColorBorder',// mapped - color12
    bgColorMuted:'ioBgColorMuted',// mapped - color13
    bgColorContainer:'ioBgColorContainer',// mapped - color14
    bgColorInput:'ioBgColorInput',// mapped - color15
    frontColorPrimary:'ioFrontColorPrimary',//mapped frontColor1
    frontColorSecondary:'ioFrontColorSecondary',//mapped frontColor2
    frontColorInfo:'ioFrontColorInfo',
    frontColorSuccess:'ioFrontColorSuccess',
    frontColorWarn:'ioFrontColorWarn',
    frontColorDanger:'ioFrontColorDanger',
    frontColorForeground:'ioFrontColorForeground',
    frontColorBg:'ioFrontColorBg',
    frontColorBorder:'ioFrontColorBorder',
    frontColorMuted:'ioFrontColorMuted',
    frontColorContainer:'ioFrontColorContainer',
    frontColorInput:'ioFrontColorInput',
} as const;
Object.freeze(baseLayoutColorMappedProps);

export const baseLayoutColorProps={
    ...baseLayoutColorBaseProps,
    ...baseLayoutColorMappedProps,

} as const;
Object.freeze(baseLayoutColorProps);
export type BaseLayoutColorProps = {
    -readonly [prop in keyof typeof baseLayoutColorProps]?:BaseLayoutFlagValues;
}

export const baseLayoutBorderProps={
    borderWidthSm:'ioBorderWidthSm',
    borderWidthMd:'ioBorderWidthMd',
    borderWidthLg:'ioBorderWidthLg',
    borderWidthXl:'ioBorderWidthXl',
    borderSolid:'ioBorderSolid',
    borderDashed:'ioBorderDashed',
    borderDotted:'ioBorderDotted',
    borderDouble:'ioBorderDouble',
    borderWidth:'ioBorderWidth',// mapped - borderWidthMd
    borderStyle:'ioBorderStyle',
    borderColorPrimary:'ioBorderColorPrimary',
    borderColorSecondary:'ioBorderColorSecondary',
    borderColorMuted:'ioBorderColorMuted',
    borderColorDanger:'ioBorderColorDanger',
    borderColorSuccess:'ioBorderColorSuccess',
    borderColorInfo:'ioBorderColorInfo',
    borderColorWarn:'ioBorderColorWarn',
    borderColor1:'ioBorderColor1',
    borderColor2:'ioBorderColor2',
    borderColor3:'ioBorderColor3',
    borderColor4:'ioBorderColor4',
    borderColor5:'ioBorderColor5',
    borderColor6:'ioBorderColor6',
    borderColor7:'ioBorderColor7',
    borderColor8:'ioBorderColor8',
    borderColor9:'ioBorderColor9',
    borderColor10:'ioBorderColor10',
    borderColor11:'ioBorderColor11',
    borderColor12:'ioBorderColor12',
    borderColor13:'ioBorderColor13',
    borderColor14:'ioBorderColor14',
    borderColor15:'ioBorderColor15',
    borderColor16:'ioBorderColor16',
    border:'ioBorder',// mapped borderWidth borderStyle borderColor
    borderH:'ioBorderH',// left right - mapped borderWidth borderStyle borderColor
    borderV:'ioBorderV',// top bottom - mapped borderWidth borderStyle borderColor
    borderT:'ioBorderT',// mapped borderWidth borderStyle borderColor
    borderB:'ioBorderB',// mapped borderWidth borderStyle borderColor
    borderL:'ioBorderL',// mapped borderWidth borderStyle borderColor
    borderR:'ioBorderR',// mapped borderWidth borderStyle borderColor
    borderNone:'ioBorderNone',
    borderNoneH:'ioBorderNoneH',
    borderNoneV:'ioBorderNoneV',
    borderNoneT:'ioBorderNoneT',
    borderNoneB:'ioBorderNoneB',
    borderNoneL:'ioBorderNoneL',
    borderNoneR:'ioBorderNoneR',
    borderNoneI:'ioBorderNoneI',
} as const;
Object.freeze(baseLayoutBorderProps);
export type BaseLayoutBorderProps = {
    -readonly [prop in keyof typeof baseLayoutBorderProps]?:BaseLayoutFlagValues;
}

export const baseLayoutFilterProps={
    filterBlur:'ioFilterBlur',
    filterBlurSm:'ioFilterBlurSm',
    filterBlurMd:'ioFilterBlurMd',
    filterBlurLg:'ioFilterBlurLg',
    filterBrighten:'ioFilterBrighten',
    filterBrightenSm:'ioFilterBrightenSm',
    filterBrightenMd:'ioFilterBrightenMd',
    filterBrightenLg:'ioFilterBrightenLg',
    filterDarken:'ioFilterDarken',
    filterDarkenSm:'ioFilterDarkenSm',
    filterDarkenMd:'ioFilterDarkenMd',
    filterDarkenLg:'ioFilterDarkenLg',
    filterGrayscale:'ioFilterGrayscale',
    filterInvert:'ioFilterInvert',
} as const;
Object.freeze(baseLayoutFilterProps);
export type BaseLayoutFilterProps = {
    -readonly [prop in keyof typeof baseLayoutFilterProps]?:BaseLayoutFlagValues;
}

export const baseLayoutRoundedProps={
    roundedNoneI:'ioRoundedNoneI',
    roundedNone:'ioRoundedNone',
    roundedSm:'ioRoundedSm',
    roundedMd:'ioRoundedMd',
    roundedLg:'ioRoundedLg',
    roundedXl:'ioRoundedXl',
    rounded:'ioRounded',// mapped - roundedMd
} as const;
Object.freeze(baseLayoutRoundedProps);
export type BaseLayoutRoundedProps = {
    -readonly [prop in keyof typeof baseLayoutRoundedProps]?:BaseLayoutFlagValues;
}


/**
 * @acGroup gap
 */
export const baseLayoutGapProps={
    g050:'ioG050',// obsolete

    g0I:'ioG0I',
    g0:'ioG0',
    g025:'ioG025',
    g05:'ioG05',
    g075:'ioG075',
    g1:'ioG1',
    g125:'ioG125',
    g15:'ioG15',
    g175:'ioG175',
    g2:'ioG2',
    g225:'ioG225',
    g25:'ioG25',
    g275:'ioG275',
    g3:'ioG3',
    g325:'ioG325',
    g35:'ioG35',
    g375:'ioG375',
    g4:'ioG4',
    g425:'ioG425',
    g45:'ioG45',
    g475:'ioG475',
    g5:'ioG5',
    g525:'ioG525',
    g55:'ioG55',
    g575:'ioG575',
    g6:'ioG6',
    g625:'ioG625',
    g65:'ioG65',
    g675:'ioG675',
    g7:'ioG7',
    g725:'ioG725',
    g75:'ioG75',
    g775:'ioG775',
    g8:'ioG8',
    g825:'ioG825',
    g85:'ioG85',
    g875:'ioG875',
    g9:'ioG9',
    g925:'ioG925',
    g95:'ioG95',
    g975:'ioG975',
    g10:'ioG10',

    gh0I:'ioGh0I',
    gh0:'ioGh0',
    gh025:'ioGh025',
    gh05:'ioGh05',
    gh075:'ioGh075',
    gh1:'ioGh1',
    gh125:'ioGh125',
    gh15:'ioGh15',
    gh175:'ioGh175',
    gh2:'ioGh2',
    gh225:'ioGh225',
    gh25:'ioGh25',
    gh275:'ioGh275',
    gh3:'ioGh3',
    gh325:'ioGh325',
    gh35:'ioGh35',
    gh375:'ioGh375',
    gh4:'ioGh4',
    gh425:'ioGh425',
    gh45:'ioGh45',
    gh475:'ioGh475',
    gh5:'ioGh5',
    gh525:'ioGh525',
    gh55:'ioGh55',
    gh575:'ioGh575',
    gh6:'ioGh6',
    gh625:'ioGh625',
    gh65:'ioGh65',
    gh675:'ioGh675',
    gh7:'ioGh7',
    gh725:'ioGh725',
    gh75:'ioGh75',
    gh775:'ioGh775',
    gh8:'ioGh8',
    gh825:'ioGh825',
    gh85:'ioGh85',
    gh875:'ioGh875',
    gh9:'ioGh9',
    gh925:'ioGh925',
    gh95:'ioGh95',
    gh975:'ioGh975',
    gh10:'ioGh10',

    gv0I:'ioGv0I',
    gv0:'ioGv0',
    gv025:'ioGv025',
    gv05:'ioGv05',
    gv075:'ioGv075',
    gv1:'ioGv1',
    gv125:'ioGv125',
    gv15:'ioGv15',
    gv175:'ioGv175',
    gv2:'ioGv2',
    gv225:'ioGv225',
    gv25:'ioGv25',
    gv275:'ioGv275',
    gv3:'ioGv3',
    gv325:'ioGv325',
    gv35:'ioGv35',
    gv375:'ioGv375',
    gv4:'ioGv4',
    gv425:'ioGv425',
    gv45:'ioGv45',
    gv475:'ioGv475',
    gv5:'ioGv5',
    gv525:'ioGv525',
    gv55:'ioGv55',
    gv575:'ioGv575',
    gv6:'ioGv6',
    gv625:'ioGv625',
    gv65:'ioGv65',
    gv675:'ioGv675',
    gv7:'ioGv7',
    gv725:'ioGv725',
    gv75:'ioGv75',
    gv775:'ioGv775',
    gv8:'ioGv8',
    gv825:'ioGv825',
    gv85:'ioGv85',
    gv875:'ioGv875',
    gv9:'ioGv9',
    gv925:'ioGv925',
    gv95:'ioGv95',
    gv975:'ioGv975',
    gv10:'ioGv10',
} as const;
Object.freeze(baseLayoutGapProps);
export type BaseLayoutGapProps = {
    -readonly [prop in keyof typeof baseLayoutGapProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup padding
 */
export const baseLayoutPaddingProps={
    p050:'ioP050',// obsolete
    pl050:'ioPl050',// obsolete
    pr050:'ioPr050',// obsolete
    pt050:'ioPt050',// obsolete
    pb050:'ioPb050',// obsolete
    ph050:'ioPh050',// obsolete
    pv050:'ioPv050',// obsolete

    p0I:'ioP0I',
    p0:'ioP0',
    p025:'ioP025',
    p05:'ioP05',
    p075:'ioP075',
    p1:'ioP1',
    p125:'ioP125',
    p15:'ioP15',
    p175:'ioP175',
    p2:'ioP2',
    p225:'ioP225',
    p25:'ioP25',
    p275:'ioP275',
    p3:'ioP3',
    p325:'ioP325',
    p35:'ioP35',
    p375:'ioP375',
    p4:'ioP4',
    p425:'ioP425',
    p45:'ioP45',
    p475:'ioP475',
    p5:'ioP5',
    p525:'ioP525',
    p55:'ioP55',
    p575:'ioP575',
    p6:'ioP6',
    p625:'ioP625',
    p65:'ioP65',
    p675:'ioP675',
    p7:'ioP7',
    p725:'ioP725',
    p75:'ioP75',
    p775:'ioP775',
    p8:'ioP8',
    p825:'ioP825',
    p85:'ioP85',
    p875:'ioP875',
    p9:'ioP9',
    p925:'ioP925',
    p95:'ioP95',
    p975:'ioP975',
    p10:'ioP10',
    pl0I:'ioPl0I',
    pl0:'ioPl0',
    pl025:'ioPl025',
    pl05:'ioPl05',
    pl075:'ioPl075',
    pl1:'ioPl1',
    pl125:'ioPl125',
    pl15:'ioPl15',
    pl175:'ioPl175',
    pl2:'ioPl2',
    pl225:'ioPl225',
    pl25:'ioPl25',
    pl275:'ioPl275',
    pl3:'ioPl3',
    pl325:'ioPl325',
    pl35:'ioPl35',
    pl375:'ioPl375',
    pl4:'ioPl4',
    pl425:'ioPl425',
    pl45:'ioPl45',
    pl475:'ioPl475',
    pl5:'ioPl5',
    pl525:'ioPl525',
    pl55:'ioPl55',
    pl575:'ioPl575',
    pl6:'ioPl6',
    pl625:'ioPl625',
    pl65:'ioPl65',
    pl675:'ioPl675',
    pl7:'ioPl7',
    pl725:'ioPl725',
    pl75:'ioPl75',
    pl775:'ioPl775',
    pl8:'ioPl8',
    pl825:'ioPl825',
    pl85:'ioPl85',
    pl875:'ioPl875',
    pl9:'ioPl9',
    pl925:'ioPl925',
    pl95:'ioPl95',
    pl975:'ioPl975',
    pl10:'ioPl10',
    pr0:'ioPr0',
    pr0I:'ioPr0I',
    pr025:'ioPr025',
    pr05:'ioPr05',
    pr075:'ioPr075',
    pr1:'ioPr1',
    pr125:'ioPr125',
    pr15:'ioPr15',
    pr175:'ioPr175',
    pr2:'ioPr2',
    pr225:'ioPr225',
    pr25:'ioPr25',
    pr275:'ioPr275',
    pr3:'ioPr3',
    pr325:'ioPr325',
    pr35:'ioPr35',
    pr375:'ioPr375',
    pr4:'ioPr4',
    pr425:'ioPr425',
    pr45:'ioPr45',
    pr475:'ioPr475',
    pr5:'ioPr5',
    pr525:'ioPr525',
    pr55:'ioPr55',
    pr575:'ioPr575',
    pr6:'ioPr6',
    pr625:'ioPr625',
    pr65:'ioPr65',
    pr675:'ioPr675',
    pr7:'ioPr7',
    pr725:'ioPr725',
    pr75:'ioPr75',
    pr775:'ioPr775',
    pr8:'ioPr8',
    pr825:'ioPr825',
    pr85:'ioPr85',
    pr875:'ioPr875',
    pr9:'ioPr9',
    pr925:'ioPr925',
    pr95:'ioPr95',
    pr975:'ioPr975',
    pr10:'ioPr10',
    pt0I:'ioPt0I',
    pt0:'ioPt0',
    pt025:'ioPt025',
    pt05:'ioPt05',
    pt075:'ioPt075',
    pt1:'ioPt1',
    pt125:'ioPt125',
    pt15:'ioPt15',
    pt175:'ioPt175',
    pt2:'ioPt2',
    pt225:'ioPt225',
    pt25:'ioPt25',
    pt275:'ioPt275',
    pt3:'ioPt3',
    pt325:'ioPt325',
    pt35:'ioPt35',
    pt375:'ioPt375',
    pt4:'ioPt4',
    pt425:'ioPt425',
    pt45:'ioPt45',
    pt475:'ioPt475',
    pt5:'ioPt5',
    pt525:'ioPt525',
    pt55:'ioPt55',
    pt575:'ioPt575',
    pt6:'ioPt6',
    pt625:'ioPt625',
    pt65:'ioPt65',
    pt675:'ioPt675',
    pt7:'ioPt7',
    pt725:'ioPt725',
    pt75:'ioPt75',
    pt775:'ioPt775',
    pt8:'ioPt8',
    pt825:'ioPt825',
    pt85:'ioPt85',
    pt875:'ioPt875',
    pt9:'ioPt9',
    pt925:'ioPt925',
    pt95:'ioPt95',
    pt975:'ioPt975',
    pt10:'ioPt10',
    pb0I:'ioPb0I',
    pb0:'ioPb0',
    pb025:'ioPb025',
    pb05:'ioPb05',
    pb075:'ioPb075',
    pb1:'ioPb1',
    pb125:'ioPb125',
    pb15:'ioPb15',
    pb175:'ioPb175',
    pb2:'ioPb2',
    pb225:'ioPb225',
    pb25:'ioPb25',
    pb275:'ioPb275',
    pb3:'ioPb3',
    pb325:'ioPb325',
    pb35:'ioPb35',
    pb375:'ioPb375',
    pb4:'ioPb4',
    pb425:'ioPb425',
    pb45:'ioPb45',
    pb475:'ioPb475',
    pb5:'ioPb5',
    pb525:'ioPb525',
    pb55:'ioPb55',
    pb575:'ioPb575',
    pb6:'ioPb6',
    pb625:'ioPb625',
    pb65:'ioPb65',
    pb675:'ioPb675',
    pb7:'ioPb7',
    pb725:'ioPb725',
    pb75:'ioPb75',
    pb775:'ioPb775',
    pb8:'ioPb8',
    pb825:'ioPb825',
    pb85:'ioPb85',
    pb875:'ioPb875',
    pb9:'ioPb9',
    pb925:'ioPb925',
    pb95:'ioPb95',
    pb975:'ioPb975',
    pb10:'ioPb10',
    ph0I:'ioPh0I',
    ph0:'ioPh0',
    ph025:'ioPh025',
    ph05:'ioPh05',
    ph075:'ioPh075',
    ph1:'ioPh1',
    ph125:'ioPh125',
    ph15:'ioPh15',
    ph175:'ioPh175',
    ph2:'ioPh2',
    ph225:'ioPh225',
    ph25:'ioPh25',
    ph275:'ioPh275',
    ph3:'ioPh3',
    ph325:'ioPh325',
    ph35:'ioPh35',
    ph375:'ioPh375',
    ph4:'ioPh4',
    ph425:'ioPh425',
    ph45:'ioPh45',
    ph475:'ioPh475',
    ph5:'ioPh5',
    ph525:'ioPh525',
    ph55:'ioPh55',
    ph575:'ioPh575',
    ph6:'ioPh6',
    ph625:'ioPh625',
    ph65:'ioPh65',
    ph675:'ioPh675',
    ph7:'ioPh7',
    ph725:'ioPh725',
    ph75:'ioPh75',
    ph775:'ioPh775',
    ph8:'ioPh8',
    ph825:'ioPh825',
    ph85:'ioPh85',
    ph875:'ioPh875',
    ph9:'ioPh9',
    ph925:'ioPh925',
    ph95:'ioPh95',
    ph975:'ioPh975',
    ph10:'ioPh10',
    pv0I:'ioPv0I',
    pv0:'ioPv0',
    pv025:'ioPv025',
    pv05:'ioPv05',
    pv075:'ioPv075',
    pv1:'ioPv1',
    pv125:'ioPv125',
    pv15:'ioPv15',
    pv175:'ioPv175',
    pv2:'ioPv2',
    pv225:'ioPv225',
    pv25:'ioPv25',
    pv275:'ioPv275',
    pv3:'ioPv3',
    pv325:'ioPv325',
    pv35:'ioPv35',
    pv375:'ioPv375',
    pv4:'ioPv4',
    pv425:'ioPv425',
    pv45:'ioPv45',
    pv475:'ioPv475',
    pv5:'ioPv5',
    pv525:'ioPv525',
    pv55:'ioPv55',
    pv575:'ioPv575',
    pv6:'ioPv6',
    pv625:'ioPv625',
    pv65:'ioPv65',
    pv675:'ioPv675',
    pv7:'ioPv7',
    pv725:'ioPv725',
    pv75:'ioPv75',
    pv775:'ioPv775',
    pv8:'ioPv8',
    pv825:'ioPv825',
    pv85:'ioPv85',
    pv875:'ioPv875',
    pv9:'ioPv9',
    pv925:'ioPv925',
    pv95:'ioPv95',
    pv975:'ioPv975',
    pv10:'ioPv10',

    // Container margin
    pCon:'ioPCon',
} as const;
Object.freeze(baseLayoutPaddingProps);
export type BaseLayoutPaddingProps = {
    -readonly [prop in keyof typeof baseLayoutPaddingProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup margin
 */
export const baseLayoutMarginProps={
    m050:'ioM050',// obsolete
    ml050:'ioMl050',// obsolete
    mr050:'ioMr050',// obsolete
    mt050:'ioMt050',// obsolete
    mb050:'ioMb050',// obsolete
    mh050:'ioMh050',// obsolete
    mv050:'ioMv050',// obsolete

    mAuto:'ioMAuto',
    mlAuto:'ioMlAuto',
    mrAuto:'ioMrAuto',
    mtAuto:'ioMtAuto',
    mbAuto:'ioMbAuto',
    mhAuto:'ioMhAuto',
    mvAuto:'ioMvAuto',

    m0I:'ioM0I',
    m0:'ioM0',
    m025:'ioM025',
    m05:'ioM05',
    m075:'ioM075',
    m1:'ioM1',
    m125:'ioM125',
    m15:'ioM15',
    m175:'ioM175',
    m2:'ioM2',
    m225:'ioM225',
    m25:'ioM25',
    m275:'ioM275',
    m3:'ioM3',
    m325:'ioM325',
    m35:'ioM35',
    m375:'ioM375',
    m4:'ioM4',
    m425:'ioM425',
    m45:'ioM45',
    m475:'ioM475',
    m5:'ioM5',
    m525:'ioM525',
    m55:'ioM55',
    m575:'ioM575',
    m6:'ioM6',
    m625:'ioM625',
    m65:'ioM65',
    m675:'ioM675',
    m7:'ioM7',
    m725:'ioM725',
    m75:'ioM75',
    m775:'ioM775',
    m8:'ioM8',
    m825:'ioM825',
    m85:'ioM85',
    m875:'ioM875',
    m9:'ioM9',
    m925:'ioM925',
    m95:'ioM95',
    m975:'ioM975',
    m10:'ioM10',
    ml0I:'ioMl0I',
    ml0:'ioMl0',
    ml025:'ioMl025',
    ml05:'ioMl05',
    ml075:'ioMl075',
    ml1:'ioMl1',
    ml125:'ioMl125',
    ml15:'ioMl15',
    ml175:'ioMl175',
    ml2:'ioMl2',
    ml225:'ioMl225',
    ml25:'ioMl25',
    ml275:'ioMl275',
    ml3:'ioMl3',
    ml325:'ioMl325',
    ml35:'ioMl35',
    ml375:'ioMl375',
    ml4:'ioMl4',
    ml425:'ioMl425',
    ml45:'ioMl45',
    ml475:'ioMl475',
    ml5:'ioMl5',
    ml525:'ioMl525',
    ml55:'ioMl55',
    ml575:'ioMl575',
    ml6:'ioMl6',
    ml625:'ioMl625',
    ml65:'ioMl65',
    ml675:'ioMl675',
    ml7:'ioMl7',
    ml725:'ioMl725',
    ml75:'ioMl75',
    ml775:'ioMl775',
    ml8:'ioMl8',
    ml825:'ioMl825',
    ml85:'ioMl85',
    ml875:'ioMl875',
    ml9:'ioMl9',
    ml925:'ioMl925',
    ml95:'ioMl95',
    ml975:'ioMl975',
    ml10:'ioMl10',
    mr0I:'ioMr0I',
    mr0:'ioMr0',
    mr025:'ioMr025',
    mr05:'ioMr05',
    mr075:'ioMr075',
    mr1:'ioMr1',
    mr125:'ioMr125',
    mr15:'ioMr15',
    mr175:'ioMr175',
    mr2:'ioMr2',
    mr225:'ioMr225',
    mr25:'ioMr25',
    mr275:'ioMr275',
    mr3:'ioMr3',
    mr325:'ioMr325',
    mr35:'ioMr35',
    mr375:'ioMr375',
    mr4:'ioMr4',
    mr425:'ioMr425',
    mr45:'ioMr45',
    mr475:'ioMr475',
    mr5:'ioMr5',
    mr525:'ioMr525',
    mr55:'ioMr55',
    mr575:'ioMr575',
    mr6:'ioMr6',
    mr625:'ioMr625',
    mr65:'ioMr65',
    mr675:'ioMr675',
    mr7:'ioMr7',
    mr725:'ioMr725',
    mr75:'ioMr75',
    mr775:'ioMr775',
    mr8:'ioMr8',
    mr825:'ioMr825',
    mr85:'ioMr85',
    mr875:'ioMr875',
    mr9:'ioMr9',
    mr925:'ioMr925',
    mr95:'ioMr95',
    mr975:'ioMr975',
    mr10:'ioMr10',
    mt0I:'ioMt0I',
    mt0:'ioMt0',
    mt025:'ioMt025',
    mt05:'ioMt05',
    mt075:'ioMt075',
    mt1:'ioMt1',
    mt125:'ioMt125',
    mt15:'ioMt15',
    mt175:'ioMt175',
    mt2:'ioMt2',
    mt225:'ioMt225',
    mt25:'ioMt25',
    mt275:'ioMt275',
    mt3:'ioMt3',
    mt325:'ioMt325',
    mt35:'ioMt35',
    mt375:'ioMt375',
    mt4:'ioMt4',
    mt425:'ioMt425',
    mt45:'ioMt45',
    mt475:'ioMt475',
    mt5:'ioMt5',
    mt525:'ioMt525',
    mt55:'ioMt55',
    mt575:'ioMt575',
    mt6:'ioMt6',
    mt625:'ioMt625',
    mt65:'ioMt65',
    mt675:'ioMt675',
    mt7:'ioMt7',
    mt725:'ioMt725',
    mt75:'ioMt75',
    mt775:'ioMt775',
    mt8:'ioMt8',
    mt825:'ioMt825',
    mt85:'ioMt85',
    mt875:'ioMt875',
    mt9:'ioMt9',
    mt925:'ioMt925',
    mt95:'ioMt95',
    mt975:'ioMt975',
    mt10:'ioMt10',
    mb0I:'ioMb0I',
    mb025:'ioMb025',
    mb05:'ioMb05',
    mb075:'ioMb075',
    mb1:'ioMb1',
    mb125:'ioMb125',
    mb15:'ioMb15',
    mb175:'ioMb175',
    mb2:'ioMb2',
    mb225:'ioMb225',
    mb25:'ioMb25',
    mb275:'ioMb275',
    mb3:'ioMb3',
    mb325:'ioMb325',
    mb35:'ioMb35',
    mb375:'ioMb375',
    mb4:'ioMb4',
    mb425:'ioMb425',
    mb45:'ioMb45',
    mb475:'ioMb475',
    mb5:'ioMb5',
    mb525:'ioMb525',
    mb55:'ioMb55',
    mb575:'ioMb575',
    mb6:'ioMb6',
    mb625:'ioMb625',
    mb65:'ioMb65',
    mb675:'ioMb675',
    mb7:'ioMb7',
    mb725:'ioMb725',
    mb75:'ioMb75',
    mb775:'ioMb775',
    mb8:'ioMb8',
    mb825:'ioMb825',
    mb85:'ioMb85',
    mb875:'ioMb875',
    mb9:'ioMb9',
    mb925:'ioMb925',
    mb95:'ioMb95',
    mb975:'ioMb975',
    mb10:'ioMb10',
    mh0I:'ioMh0I',
    mh0:'ioMh0',
    mh025:'ioMh025',
    mh05:'ioMh05',
    mh075:'ioMh075',
    mh1:'ioMh1',
    mh125:'ioMh125',
    mh15:'ioMh15',
    mh175:'ioMh175',
    mh2:'ioMh2',
    mh225:'ioMh225',
    mh25:'ioMh25',
    mh275:'ioMh275',
    mh3:'ioMh3',
    mh325:'ioMh325',
    mh35:'ioMh35',
    mh375:'ioMh375',
    mh4:'ioMh4',
    mh425:'ioMh425',
    mh45:'ioMh45',
    mh475:'ioMh475',
    mh5:'ioMh5',
    mh525:'ioMh525',
    mh55:'ioMh55',
    mh575:'ioMh575',
    mh6:'ioMh6',
    mh625:'ioMh625',
    mh65:'ioMh65',
    mh675:'ioMh675',
    mh7:'ioMh7',
    mh725:'ioMh725',
    mh75:'ioMh75',
    mh775:'ioMh775',
    mh8:'ioMh8',
    mh825:'ioMh825',
    mh85:'ioMh85',
    mh875:'ioMh875',
    mh9:'ioMh9',
    mh925:'ioMh925',
    mh95:'ioMh95',
    mh975:'ioMh975',
    mh10:'ioMh10',
    mv0I:'ioMv0I',
    mv0:'ioMv0',
    mv025:'ioMv025',
    mv05:'ioMv05',
    mv075:'ioMv075',
    mv1:'ioMv1',
    mv125:'ioMv125',
    mv15:'ioMv15',
    mv175:'ioMv175',
    mv2:'ioMv2',
    mv225:'ioMv225',
    mv25:'ioMv25',
    mv275:'ioMv275',
    mv3:'ioMv3',
    mv325:'ioMv325',
    mv35:'ioMv35',
    mv375:'ioMv375',
    mv4:'ioMv4',
    mv425:'ioMv425',
    mv45:'ioMv45',
    mv475:'ioMv475',
    mv5:'ioMv5',
    mv525:'ioMv525',
    mv55:'ioMv55',
    mv575:'ioMv575',
    mv6:'ioMv6',
    mv625:'ioMv625',
    mv65:'ioMv65',
    mv675:'ioMv675',
    mv7:'ioMv7',
    mv725:'ioMv725',
    mv75:'ioMv75',
    mv775:'ioMv775',
    mv8:'ioMv8',
    mv825:'ioMv825',
    mv85:'ioMv85',
    mv875:'ioMv875',
    mv9:'ioMv9',
    mv925:'ioMv925',
    mv95:'ioMv95',
    mv975:'ioMv975',
    mv10:'ioMv10',
    // Container margin
    mCon:'ioMCon',
} as const;
Object.freeze(baseLayoutMarginProps);
export type BaseLayoutMarginProps = {
    -readonly [prop in keyof typeof baseLayoutMarginProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup flexLayout
 */
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
    justifyEvenly:'ioJustifyEvenly',
    justifyBetween:'ioJustifyBetween',
    alignCenter:'ioAlignCenter',
    alignStart:'ioAlignStart',
    alignEnd:'ioAlignEnd',
    alignStretch:'ioAlignStretch',
} as const;
Object.freeze(baseLayoutInnerFlexProps);
export type BaseLayoutInnerFlexProps = {
    -readonly [prop in keyof typeof baseLayoutInnerFlexProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup flex
 */
export const baseLayoutFlexProps={
    flex1:'ioFlex1',
    flex2:'ioFlex2',
    flex3:'ioFlex3',
    flex4:'ioFlex4',
    flex5:'ioFlex5',
    flex6:'ioFlex6',
    flex7:'ioFlex7',
    flex8:'ioFlex8',
    flex9:'ioFlex9',
    flex10:'ioFlex10',
} as const;
Object.freeze(baseLayoutFlexProps);
export type BaseLayoutFlexProps = {
    -readonly [prop in keyof typeof baseLayoutFlexProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup selfAlignment
 */
export const baseLayoutSelfFlexProps={
    selfAlignCenter:'ioSelfAlignCenter',
    selfAlignStart:'ioSelfAlignStart',
    selfAlignEnd:'ioSelfAlignEnd',
    selfAlignStretch:'ioSelfAlignStretch',
} as const;
Object.freeze(baseLayoutSelfFlexProps);
export type BaseLayoutSelfFlexProps = {
    -readonly [prop in keyof typeof baseLayoutSelfFlexProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup grid
 */
export const baseLayoutInnerGridProps={
    displayGrid:'ioDisplayGrid',
    displayInlineGrid:'ioDisplayInlineGrid',
    grid1:'ioGrid1',
    grid2:'ioGrid2',
    grid3:'ioGrid3',
    grid4:'ioGrid4',
    grid5:'ioGrid5',
    grid6:'ioGrid6',
    grid7:'ioGrid7',
    grid8:'ioGrid8',
    grid9:'ioGrid9',
    grid10:'ioGrid10',
    gridAuto1:'ioGridAuto1',
    gridAuto2:'ioGridAuto2',
    gridAuto3:'ioGridAuto3',
    gridAuto4:'ioGridAuto4',
    gridAuto5:'ioGridAuto5',
    gridAuto6:'ioGridAuto6',
    gridAuto7:'ioGridAuto7',
    gridAuto8:'ioGridAuto8',
    gridAuto9:'ioGridAuto9',
    gridAuto10:'ioGridAuto10',
    gridLeftAuto2:'ioGridLeftAuto2',
    gridLeftAuto3:'ioGridLeftAuto3',
    gridLeftAuto4:'ioGridLeftAuto4',

} as const;
Object.freeze(baseLayoutInnerGridProps);
export type BaseLayoutInnerGridProps = {
    -readonly [prop in keyof typeof baseLayoutInnerGridProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup layout
 */
export const baseLayoutParentLayoutProps={
    stackingRow:'ioStackingRow',
    flexGrid:'ioFlexGrid',
}
Object.freeze(baseLayoutParentLayoutProps);
export type BaseLayoutParentLayoutProps = {
    -readonly [prop in keyof typeof baseLayoutParentLayoutProps]?:BaseLayoutFlagValues;
}

/**
 * @acGroup breakpoint
 */
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
    -readonly [prop in keyof typeof baseLayoutBreakpointProps]?:BaseLayoutBreakpointFlagValue;
}

export type BaseLayoutBreakpointFlagValue=boolean;

/**
 * @acGroup util
 */
export const baseLayoutUtilProps={
    offScreen:'ioOffScreen',
    posAbs:'ioPosAbs',
    absTop:'ioAbsTop',
    absBottom:'ioAbsBottom',
    absLeft:'ioAbsLeft',
    absRight:'ioAbsRight',
    absTopLeft:'ioAbsTopLeft',
    absTopRight:'ioAbsTopRight',
    absBottomLeft:'ioAbsBottomLeft',
    absBottomRight:'ioAbsBottomRight',
    absCenter:'ioAbsCenter',
    absRightCenter:'ioAbsRightCenter',
    absLeftCenter:'ioAbsLeftCenter',
    absTopCenter:'ioAbsTopCenter',
    absBottomCenter:'ioAbsBottomCenter',
    posRel:'ioPosRel',
    posFixed:'ioPosFixed',
    absFill:'ioAbsFill',
    absFillWh:'ioAbsFillWh',
    wh100:'ioWh100',
    w100:'ioW100',
    h100:'ioH100',
    width0:'ioWidth0',
    width1:'ioWidth1',
    width2:'ioWidth2',
    width3:'ioWidth3',
    width4:'ioWidth4',
    width5:'ioWidth5',
    width6:'ioWidth6',
    width7:'ioWidth7',
    width8:'ioWidth8',
    width9:'ioWidth9',
    width10:'ioWidth10',
    width11:'ioWidth11',
    width12:'ioWidth12',
    width13:'ioWidth13',
    width14:'ioWidth14',
    width15:'ioWidth15',
    width16:'ioWidth16',
    width24:'ioWidth24',
    width32:'ioWidth32',
    width40:'ioWidth40',
    width45:'ioWidth45',
    width48:'ioWidth48',
    width56:'ioWidth56',
    width64:'ioWidth64',
    width72:'ioWidth72',
    width80:'ioWidth80',
    width88:'ioWidth88',
    width96:'ioWidth96',
    width104:'ioWidth104',
    width112:'ioWidth112',
    width120:'ioWidth120',
    width128:'ioWidth128',
    width135:'ioWidth135',
    width136:'ioWidth136',
    width144:'ioWidth144',
    height0:'ioHeight0',
    height1:'ioHeight1',
    height2:'ioHeight2',
    height3:'ioHeight3',
    height4:'ioHeight4',
    height5:'ioHeight5',
    height6:'ioHeight6',
    height7:'ioHeight7',
    height8:'ioHeight8',
    height9:'ioHeight9',
    height10:'ioHeight10',
    height11:'ioHeight11',
    height12:'ioHeight12',
    height13:'ioHeight13',
    height14:'ioHeight14',
    height15:'ioHeight15',
    height16:'ioHeight16',
    height24:'ioHeight24',
    height32:'ioHeight32',
    height40:'ioHeight40',
    height45:'ioHeight45',
    height48:'ioHeight48',
    height56:'ioHeight56',
    height64:'ioHeight64',
    height72:'ioHeight72',
    height80:'ioHeight80',
    height88:'ioHeight88',
    height96:'ioHeight96',
    height104:'ioHeight104',
    height112:'ioHeight112',
    height120:'ioHeight120',
    height128:'ioHeight128',
    height135:'ioHeight135',
    height136:'ioHeight136',
    height144:'ioHeight144',

    wMin0:'ioWMin0',
    wMin1:'ioWMin1',
    wMin2:'ioWMin2',
    wMin3:'ioWMin3',
    wMin4:'ioWMin4',
    wMin5:'ioWMin5',
    wMin6:'ioWMin6',
    wMin7:'ioWMin7',
    wMin8:'ioWMin8',
    wMin9:'ioWMin9',
    wMin10:'ioWMin10',
    wMin11:'ioWMin11',
    wMin12:'ioWMin12',
    wMin13:'ioWMin13',
    wMin14:'ioWMin14',
    wMin15:'ioWMin15',
    wMin16:'ioWMin16',
    wMin24:'ioWMin24',
    wMin32:'ioWMin32',
    wMin40:'ioWMin40',
    wMin45:'ioWMin45',
    wMin48:'ioWMin48',
    wMin56:'ioWMin56',
    wMin64:'ioWMin64',
    wMin72:'ioWMin72',
    wMin80:'ioWMin80',
    wMin88:'ioWMin88',
    wMin96:'ioWMin96',
    wMin104:'ioWMin104',
    wMin112:'ioWMin112',
    wMin120:'ioWMin120',
    wMin128:'ioWMin128',
    wMin135:'ioWMin135',
    wMin136:'ioWMin136',
    wMin144:'ioWMin144',
    hMin0:'ioHMin0',
    hMin1:'ioHMin1',
    hMin2:'ioHMin2',
    hMin3:'ioHMin3',
    hMin4:'ioHMin4',
    hMin5:'ioHMin5',
    hMin6:'ioHMin6',
    hMin7:'ioHMin7',
    hMin8:'ioHMin8',
    hMin9:'ioHMin9',
    hMin10:'ioHMin10',
    hMin11:'ioHMin11',
    hMin12:'ioHMin12',
    hMin13:'ioHMin13',
    hMin14:'ioHMin14',
    hMin15:'ioHMin15',
    hMin16:'ioHMin16',
    hMin24:'ioHMin24',
    hMin32:'ioHMin32',
    hMin40:'ioHMin40',
    hMin45:'ioHMin45',
    hMin48:'ioHMin48',
    hMin56:'ioHMin56',
    hMin64:'ioHMin64',
    hMin72:'ioHMin72',
    hMin80:'ioHMin80',
    hMin88:'ioHMin88',
    hMin96:'ioHMin96',
    hMin104:'ioHMin104',
    hMin112:'ioHMin112',
    hMin120:'ioHMin120',
    hMin128:'ioHMin128',
    hMin135:'ioHMin135',
    hMin136:'ioHMin136',
    hMin144:'ioHMin144',


    wMax0:'ioWMax0',
    wMax1:'ioWMax1',
    wMax2:'ioWMax2',
    wMax3:'ioWMax3',
    wMax4:'ioWMax4',
    wMax5:'ioWMax5',
    wMax6:'ioWMax6',
    wMax7:'ioWMax7',
    wMax8:'ioWMax8',
    wMax9:'ioWMax9',
    wMax10:'ioWMax10',
    wMax11:'ioWMax11',
    wMax12:'ioWMax12',
    wMax13:'ioWMax13',
    wMax14:'ioWMax14',
    wMax15:'ioWMax15',
    wMax16:'ioWMax16',
    wMax24:'ioWMax24',
    wMax32:'ioWMax32',
    wMax40:'ioWMax40',
    wMax45:'ioWMax45',
    wMax48:'ioWMax48',
    wMax56:'ioWMax56',
    wMax64:'ioWMax64',
    wMax72:'ioWMax72',
    wMax80:'ioWMax80',
    wMax88:'ioWMax88',
    wMax96:'ioWMax96',
    wMax104:'ioWMax104',
    wMax112:'ioWMax112',
    wMax120:'ioWMax120',
    wMax128:'ioWMax128',
    wMax135:'ioWMax135',
    wMax136:'ioWMax136',
    wMax144:'ioWMax144',
    hMax0:'ioHMax0',
    hMax1:'ioHMax1',
    hMax2:'ioHMax2',
    hMax3:'ioHMax3',
    hMax4:'ioHMax4',
    hMax5:'ioHMax5',
    hMax6:'ioHMax6',
    hMax7:'ioHMax7',
    hMax8:'ioHMax8',
    hMax9:'ioHMax9',
    hMax10:'ioHMax10',
    hMax11:'ioHMax11',
    hMax12:'ioHMax12',
    hMax13:'ioHMax13',
    hMax14:'ioHMax14',
    hMax15:'ioHMax15',
    hMax16:'ioHMax16',
    hMax24:'ioHMax24',
    hMax32:'ioHMax32',
    hMax40:'ioHMax40',
    hMax45:'ioHMax45',
    hMax48:'ioHMax48',
    hMax56:'ioHMax56',
    hMax64:'ioHMax64',
    hMax72:'ioHMax72',
    hMax80:'ioHMax80',
    hMax88:'ioHMax88',
    hMax96:'ioHMax96',
    hMax104:'ioHMax104',
    hMax112:'ioHMax112',
    hMax120:'ioHMax120',
    hMax128:'ioHMax128',
    hMax135:'ioHMax135',
    hMax136:'ioHMax136',
    hMax144:'ioHMax144',

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
    zIndex7:'ioZIndex7',
    zIndex8:'ioZIndex8',
    zIndex9:'ioZIndex9',
    zIndex10:'ioZIndex10',
    zIndexMax:'ioZIndexMax',
    zIndexNeg1:'ioZIndexNeg1',
    zIndexNeg2:'ioZIndexNeg2',
    zIndexNeg3:'ioZIndexNeg3',
    zIndexNeg4:'ioZIndexNeg4',
    zIndexNeg5:'ioZIndexNeg5',
    zIndexNeg6:'ioZIndexNeg6',
    zIndexNeg7:'ioZIndexNeg7',
    zIndexNeg8:'ioZIndexNeg8',
    zIndexNeg9:'ioZIndexNeg9',
    zIndexNeg10:'ioZIndexNeg10',
    zIndexMin:'ioZIndexMin',
    zIsolate:'ioZIsolate',
    opacity0:'ioOpacity0',
    opacity025:'ioOpacity025',
    opacity050:'ioOpacity050',
    opacity075:'ioOpacity075',
    opacity1:'ioOpacity1',
    opacityHidden:'ioOpacityHidden',
    semiTransparent:'ioSemiTransparent',
    visHidden:'ioVisHidden',
    visCollapsed:'ioVisCollapsed',
    visVisible:'ioVisVisible',
    unsetAll:'ioUnsetAll',

} as const;
Object.freeze(baseLayoutUtilProps);
export type BaseLayoutUtilProps = {
    -readonly [prop in keyof typeof baseLayoutUtilProps]?:BaseLayoutFlagValues;
}

export const baseLayoutFlagProps={
    ...baseLayoutPaddingProps,
    ...baseLayoutMarginProps,
    ...baseLayoutColumnProps,
    ...baseLayoutFlexProps,
    ...baseLayoutInnerFlexProps,
    ...baseLayoutSelfFlexProps,
    ...baseLayoutGapProps,
    ...baseLayoutBorderProps,
    ...baseLayoutRoundedProps,
    ...baseLayoutFontProps,
    ...baseLayoutColorProps,
    ...baseLayoutInnerGridProps,
    ...baseLayoutParentLayoutProps,
    ...baseLayoutBreakpointProps,
    ...baseLayoutUtilProps,
    ...baseLayoutFilterProps,
} as const;
Object.freeze(baseLayoutFlagProps);
export type BaseLayoutFlagProps = {
    -readonly [prop in keyof typeof baseLayoutFlagProps]?:BaseLayoutFlagValues;
}

const allMap={
    ...baseLayoutFlagProps,
    ...baseLayoutAnimationProps,
} as const;

export const allBaseLayoutFlagProps:(keyof BaseLayoutFlagProps)[]=[];
for(const e in baseLayoutFlagProps){
    allBaseLayoutFlagProps.push(e as any);
}
Object.freeze(allBaseLayoutFlagProps);

/**
 * @acGroup className
 */
export interface BaseLayoutClassNameProps
{
    className?:string;
}


export type BaseLayoutInnerProps =
    BaseLayoutAnimationProps &
    BaseLayoutPaddingProps &
    BaseLayoutGapProps &
    BaseLayoutBorderProps &
    BaseLayoutRoundedProps &
    BaseLayoutInnerFlexProps &
    BaseLayoutClassNameProps &
    BaseLayoutParentLayoutProps &
    BaseLayoutBreakpointProps &
    BaseLayoutFontProps &
    BaseLayoutColorProps &
    BaseLayoutUtilProps &
    BaseLayoutFilterProps;

export type BaseLayoutOuterNoFlexProps =
    BaseLayoutAnimationProps &
    BaseLayoutMarginProps &
    BaseLayoutSelfFlexProps &
    BaseLayoutClassNameProps &
    BaseLayoutBreakpointProps &
    BaseLayoutUtilProps &
    BaseLayoutFontProps &
    BaseLayoutColorProps &
    BaseLayoutColumnProps &
    BaseLayoutFilterProps;

export type BaseLayoutOuterProps =
    BaseLayoutOuterNoFlexProps &
    BaseLayoutFlexProps &
    BaseLayoutAnimationProps &
    BaseLayoutFontProps &
    BaseLayoutColorProps &
    BaseLayoutBorderProps &
    BaseLayoutRoundedProps &
    BaseLayoutColumnProps &
    BaseLayoutFilterProps;


export type BaseLayoutProps =
    BaseLayoutAnimationProps &
    BaseLayoutFlagProps &
    BaseLayoutClassNameProps &
    BaseLayoutTextOnlyFontProps;


export type AllBaseLayoutProps=BaseLayoutProps;


let incremental=isServerSide;
export const setBaseLayoutClassesIncremental=(isIncremental:boolean)=>{
    incremental=isIncremental;
}

export const baseLayoutIncrementalMap:HashMap<boolean>={}

export const baseLayoutCn=(props:Partial<AllBaseLayoutProps>):string|undefined=>
{
    if(!props){
        return undefined;
    }
    let classNames:string|undefined;
    let cn:string;
    for(const e in props){
        let v=(props as any)[e];
        let vv:any;
        if(
            (
                v===true ||
                allDirectionalBreakpoints.includes(v as any) ||
                (vv=allDirectionalBreakpointAliases.includes(v as any)) ||
                ((baseLayoutAnimationSpeeds.includes(v as any) && (baseLayoutAnimationProps as any)[e]))
            ) &&
            (cn=(allMap as any)[e]))
        {
            if(vv){
                v=(currentDirectionalBreakpointAliases.value as any)[v];
                if(!v){
                    continue;
                }
            }
            if(incremental){
                baseLayoutIncrementalMap[e+(v===true?'':'-'+v)]=true;
            }
            classNames=(classNames?classNames+' ':'')+cn+(v===true?'':'-'+v);
        }else if((vv=allBaseLayoutModifiers.indexOf(v))!==-1 && (cn=(allMap as any)[e])){
            const mod=allBaseLayoutModifiersMap[vv];
            if(incremental){
                baseLayoutIncrementalMap[e+'--'+mod]=true;
            }
            classNames=(classNames?classNames+' ':'')+cn+'--'+mod;
        }else if(Array.isArray(v)){
            for(let av of v){
                if(
                    (
                        av===true ||
                        allDirectionalBreakpoints.includes(av as any) ||
                        (vv=allDirectionalBreakpointAliases.includes(av as any)) ||
                        ((baseLayoutAnimationSpeeds.includes(av as any) && (baseLayoutAnimationProps as any)[e]))
                    ) &&
                    (cn=(allMap as any)[e]))
                {
                    if(vv){
                        av=(currentDirectionalBreakpointAliases.value as any)[av];
                        if(!av){
                            continue;
                        }
                    }
                    if(incremental){
                        baseLayoutIncrementalMap[e+(av===true?'':'-'+av)]=true;
                    }
                    classNames=(classNames?classNames+' ':'')+cn+(av===true?'':'-'+av);
                }else if((vv=allBaseLayoutModifiers.indexOf(av))!==-1 && (cn=(allMap as any)[e])){
                    const mod=allBaseLayoutModifiersMap[vv];
                    if(incremental){
                        baseLayoutIncrementalMap[e+'--'+mod]=true;
                    }
                    classNames=(classNames?classNames+' ':'')+cn+'--'+mod;
                }
            }
        }
    }
    if(props["className"]){
        classNames=(classNames?classNames+' ':'')+props["className"];
    }
    return classNames;
}

export const bcn=(
    props:Partial<AllBaseLayoutProps>,
    ...classNames:ClassNameValue[]
):string|undefined=>{
    if(classNames.length){
        if(classNames.length===1){
            return cn(classNames[0],baseLayoutCn(props));
        }else if(classNames.length===2){
            return cn(classNames[0],classNames[1],baseLayoutCn(props));
        }else if(classNames.length===3){
            return cn(classNames[0],classNames[1],classNames[2],baseLayoutCn(props));
        }else{
            return cn(...classNames,baseLayoutCn(props));
        }
    }else{
        return baseLayoutCn(props);
    }
}
