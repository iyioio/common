export interface ChartScale
{
    scale:number;
    step:number;
}

export interface SvgChartCtrlOptions
{
    data?:ChartData;
    style?:ChartStyle;
    hLines?:boolean;
    hLinesFullWidth?:boolean;
    vLines?:boolean;
    hLineSpacing?:number;
    zoom?:number;
    viewBox?:string|null;
    showValueLabels?:boolean;
    showLabelLabels?:boolean;
    labelHAlignment?:'left'|'right';
    labelVAlignment?:'top'|'bottom';
}

export interface ChartData
{
    labels:string[];
    series:number[][];
}

export interface ChartStyle
{
    series?:Partial<SeriesStyle>[];
}


export interface SeriesStyle
{
    smoothness:number;
}

export interface ChartRenderOptions
{
    min:number;
    max:number;
    diff:number;
    width:number;
    height:number;
    hLineSpacing:number;
    hLineCount:number;
    valueCount:number;
    valueStep:number;
    left:number;
    right:number;
    top:number;
    bottom:number;
    viewBoxWidth:number;
    viewBoxHeight:number;
}
