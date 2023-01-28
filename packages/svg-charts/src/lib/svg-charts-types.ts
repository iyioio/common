import { Sides } from "@iyio/common";

export interface ChartScale
{
    scale:number;
    step:number;
}

export interface SvgChartCtrlOptions
{
    id?:string;
    data?:ChartData;
    seriesOptions?:Partial<SeriesOptions>[];
    hLines?:boolean;
    vLinePadding?:number;
    hLinesFullWidth?:boolean;
    vLines?:boolean;
    hLineSpacing?:number;
    zoom?:number;
    viewBox?:string|null;
    showValueLabels?:boolean;
    showLabelLabels?:boolean;
    labelHAlignment?:'left'|'right';
    labelVAlignment?:'top'|'bottom';
    autoResize?:boolean;
    removeElementsOnDispose?:boolean;
    min?:boolean;
    /**
     * For bar charts if true series values are stacked on top of each other
     */
    stack?:boolean;
    css?:string;
    className?:string|null;
}

export interface ChartData
{
    labels:string[];
    series:number[][];
}


export interface SeriesOptions
{
    smoothness:number;
    thickness:number;
    margin:number;
    cornerRadius:number;
}

export interface ChartRenderOptions
{
    min:number;
    max:number;
    diff:number;
    width:number;
    height:number;
    left:number;
    right:number;
    top:number;
    bottom:number;
    hLineSpacing:number;
    hLineCount:number;
    valueCount:number;
    valueStep:number;
    viewBoxWidth:number;
    viewBoxHeight:number;
    renderPadding:Sides;

    canvasWidth:number;
    canvasHeight:number;
    canvasLeft:number;
    canvasRight:number;
    canvasTop:number;
    canvasBottom:number;
}
