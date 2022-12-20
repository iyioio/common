import { HashMap } from "./common-types";
import { Breakpoints } from "./window-size-lib";

export interface BaseLayoutSpacings
{
    space0?:string;
    space1?:string;
    space2?:string;
    space3?:string;
    space4?:string;
    space5?:string;
    space6?:string;
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
}

export interface BaseLayoutCssOptions extends BaseLayoutCssGenerationOptions
{

    appendCss?:string|((pushTo:string[],options:BaseLayoutCssOptions)=>void);

    breakpoints?:Breakpoints;
}
