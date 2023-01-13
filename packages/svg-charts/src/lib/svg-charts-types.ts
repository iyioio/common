export interface ChartData
{
    labels:string[];
    values:number[][];
}

export interface ChartStyle
{
    values?:ChartValueStyle[];
}

export interface ChartValueStyle
{
    color?:string;
}

export interface SvgChartCtrlOptions
{
    data?:ChartData;
    style?:ChartStyle;
}
