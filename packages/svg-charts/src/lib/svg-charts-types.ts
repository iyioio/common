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
    showIntersectionValues?:boolean;
    labelHAlignment?:'left'|'right';
    labelVAlignment?:'top'|'bottom';
    autoResize?:boolean;
    removeElementsOnDispose?:boolean;
    min?:boolean;
    showOverlaysWithMin?:boolean;
    /**
     * For bar charts if true series values are stacked on top of each other
     */
    stack?:boolean;
    css?:string;
    className?:string|null;
    steps?:number[];
    enableSnapping?: boolean;
}

export interface ChartData
{
    /**
     * If defined changes to chart data will only be rendered when renderId is changed
     */
    renderId?:string;
    labels:string[];
    series:number[][];
    timestamps?: number[][];
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


export interface ChartIntersection
{
    x:number;
    y:number;
    clientX:number;
    clientY:number;
    value:number;
    valueClass:string;
    timestamp?: number;
}
