import { baseLayoutColorBaseProps, baseLayoutColorMappedProps } from "./base-layout.js";
import { BaseLayoutBreakpointOptions } from "./base-layout-generator.js";
import { HashMap } from "./common-types.js";
import { RequiredRecursive } from "./typescript-util-types.js";
import { Breakpoints } from "./window-size-lib.js";

export interface BaseLayoutSpacings
{
    space050?:string;

    space0?:string;
    space025?:string;
    space05?:string;
    space075?:string;
    space1?:string;
    space125?:string;
    space15?:string;
    space175?:string;
    space2?:string;
    space225?:string;
    space25?:string;
    space275?:string;
    space3?:string;
    space325?:string;
    space35?:string;
    space375?:string;
    space4?:string;
    space425?:string;
    space45?:string;
    space475?:string;
    space5?:string;
    space525?:string;
    space55?:string;
    space575?:string;
    space6?:string;
    space625?:string;
    space65?:string;
    space675?:string;
    space7?:string;
    space725?:string;
    space75?:string;
    space775?:string;
    space8?:string;
    space825?:string;
    space85?:string;
    space875?:string;
    space9?:string;
    space925?:string;
    space95?:string;
    space975?:string;
    space10?:string;
}

export interface BaseLayoutColumnWidths
{
    columnXs?:string;
    columnSm?:string;
    columnMd?:string;
    columnLg?:string;
    columnXl?:string;
}

export interface BaseLayoutAnimationSpeeds
{
    animationFast?:string;
    animationQuick?:string;
    animationSlow?:string;
    animationExtraSlow?:string;
}

export interface FontFaceSize
{
    size?:string;
    lineHeight?:string;
}
export interface FontFace extends FontFaceSize
{
    family?:string;
    color?:string;
    weight?:string;
    style?:string;
    stretch?:string;
    kerning?:string;
    transform?:string;
    variation?:string;
    spacing?:string;
    css?:string;
}

export interface FontFaces
{
    faceDefault?:FontFace;
    face0?:FontFace,
    face1?:FontFace,
    face2?:FontFace,
    face3?:FontFace,
    face4?:FontFace,
    face5?:FontFace,
    face6?:FontFace,
    face7?:FontFace,
    face8?:FontFace,
    face9?:FontFace,
    face10?:FontFace,
    face11?:FontFace,
    face12?:FontFace,
    face13?:FontFace,
    face14?:FontFace,
    face15?:FontFace,
    face16?:FontFace,
    face17?:FontFace,
    face18?:FontFace,
    face19?:FontFace,
    face20?:FontFace,
}

export interface FontFaceConfig extends FontFaces
{
    xxxs?:FontFaceSize;
    xxs?:FontFaceSize;
    xs?:FontFaceSize;
    sm?:FontFaceSize;
    md?:FontFaceSize;
    lg?:FontFaceSize;
    xl?:FontFaceSize;
    xxl?:FontFaceSize;
    xxxl?:FontFaceSize;
    normalize?:boolean;
    lineHeight?:string;
    weightLight?:string;
    weightNormal?:string;
    weightMedium?:string;
    weightBold?:string;
    linkDecoration?:string;
    linkDisplay?:string;
    body?:keyof FontFaces;
    h1?:keyof FontFaces;
    h2?:keyof FontFaces;
    h3?:keyof FontFaces;
    h4?:keyof FontFaces;
    h5?:keyof FontFaces;
    h6?:keyof FontFaces;
}

export interface FilterConfig
{
    filterBlur?:'filterBlurSm'|'filterBlurMd'|'filterBlurLg';
    filterBlurSm?:string;
    filterBlurMd?:string;
    filterBlurLg?:string;
    filterBrighten?:'filterBrightenSm'|'filterBrightenMd'|'filterBrightenLg';
    filterBrightenSm?:string;
    filterBrightenMd?:string;
    filterBrightenLg?:string;
    filterDarken?:'filterDarkenSm'|'filterDarkenMd'|'filterDarkenLg';
    filterDarkenSm?:string;
    filterDarkenMd?:string;
    filterDarkenLg?:string;
}

export type LayoutColors = {
    -readonly [prop in keyof typeof baseLayoutColorBaseProps]?:string;
}
export type LayoutMappedColors = {
    -readonly [prop in keyof typeof baseLayoutColorMappedProps]?:keyof LayoutColors;
}

export interface BorderConfigValues{
    borderWidthSm?:string;
    borderWidthMd?:string;
    borderWidthLg?:string;
    borderWidthXl?:string;
}

export interface BorderConfig extends BorderConfigValues
{
    borderWidth?:keyof BorderConfigValues;
    borderStyle?:string;
    borderColor?:string;
}

export interface RoundedConfigValues
{
    roundedSm?:string;
    roundedMd?:string;
    roundedLg?:string;
    roundedXl?:string;
}
export interface RoundedConfig extends RoundedConfigValues
{
    disabledRounding?:boolean;
    rounded?:keyof RoundedConfigValues;
}

export type LayoutColorConfig = LayoutColors & LayoutMappedColors;

export interface BaseLayoutCssGenerationOptions
{
    /**
     * If defined generated css will be appended to this array and an empty string will be returned.
     * Using this parameter helps reduced large memory allocations with calling
     * generateBaseLayoutStyleSheet for multiple breakpoints.
     */
    lines?:string[];

    /**
     * The line separator used with joining the lines that create the returned css
     */
    lineSeparator?:string;

    filter?:HashMap<boolean>;

    /**
     * Will be replaced with hard coded values
     * @obsolete
     */
    spacing?:BaseLayoutSpacings;

    columnWidths?:BaseLayoutColumnWidths;

    animationSpeeds?:BaseLayoutAnimationSpeeds;

    /**
     * Margin and padding used for containers
     */
    containerMargin?:string;

    /**
     * The value used for semi-transparencies.
     * @default 0.5
     */
    semiTransparency?:number|string;

    fontConfig?:FontFaceConfig;

    filterConfig?:FilterConfig;

    colors?:LayoutColorConfig;

    boxSizing?:string|null;

    border?:BorderConfig;

    rounded?:RoundedConfig;

    /**
     * do not include the -- as part of the var names.
     */
    vars?:BaseLayoutVarContainer[];
}

export interface BaseLayoutVarContainer
{
    /**
     * do not the -- as part of the var names.
     */
    vars:Record<string,string>;

    selector?:string;
}

export type BaseLayoutBreakpointOptionsDefaults=BaseLayoutBreakpointOptions & RequiredRecursive<Pick<BaseLayoutBreakpointOptions,
    'spacing'|'columnWidths'|'animationSpeeds'|'containerMargin'|
    'semiTransparency'|'animationSpeeds'|'border'|'rounded'|'filterConfig'
>>

export interface BaseLayoutCssOptions extends BaseLayoutCssGenerationOptions
{

    appendCss?:string|((pushTo:string[],options:BaseLayoutCssOptions)=>void);

    breakpoints?:Breakpoints;

    defaultTheme?:string;

    themes?:Record<string,BaseLayoutCssGenerationOptions>;
}
