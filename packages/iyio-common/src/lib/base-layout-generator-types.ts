import { baseLayoutColorBaseProps, baseLayoutColorMappedProps } from "./base-layout";
import { HashMap } from "./common-types";
import { Breakpoints } from "./window-size-lib";

export interface BaseLayoutSpacings
{
    space0?:string;
    space025?:string;
    space050?:string;
    space075?:string;
    space1?:string;
    space2?:string;
    space3?:string;
    space4?:string;
    space5?:string;
    space6?:string;
    space7?:string;
    space8?:string;
    space9?:string;
    space10?:string;
}

export interface BaseLayoutColumnWidths
{
    xs?:string;
    sm?:string;
    md?:string;
    lg?:string;
    xl?:string;
}

export interface BaseLayoutAnimationSpeeds
{
    fast?:string;
    quick?:string;
    slow?:string;
    extraSlow?:string;
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
    weightBold?:string;
    weightThin?:string;
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

export type LayoutColors = {
    -readonly [prop in keyof typeof baseLayoutColorBaseProps]?:string;
}
export type LayoutMappedColors = {
    -readonly [prop in keyof typeof baseLayoutColorMappedProps]?:keyof LayoutColors;
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

    colors?:LayoutColorConfig;

    boxSizing?:string|null;
}

export interface BaseLayoutCssOptions extends BaseLayoutCssGenerationOptions
{

    appendCss?:string|((pushTo:string[],options:BaseLayoutCssOptions)=>void);

    breakpoints?:Breakpoints;
}
