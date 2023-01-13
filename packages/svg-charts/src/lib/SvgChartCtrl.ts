import { ChartData, ChartStyle, SvgChartCtrlOptions } from "./svg-charts-types";

export class SvgChartCtrl
{
    public readonly container:SVGSVGElement;


    private _data:ChartData;
    public get data():ChartData {
        return this._data;
    }
    public set data(v:ChartData) {
        this._data = v;
    }


    private _style:ChartStyle;
    public get style():ChartStyle {
        return this._style;
    }
    public set style(v:ChartStyle) {
        this._style = v;
    }



    public constructor(options?:SvgChartCtrlOptions, container?:SVGSVGElement)
    {

        if(!container){
            container=document.createElementNS('http://www.w3.org/2000/svg','svg');
        }

        this.container=container;

        this._data=options?.data??{
            labels:[],
            values:[],
        }

        this._style=options?.style??{

        }

    }

    private render()
    {
        this.renderData();
        this.renderStyle();
    }

    private renderData()
    {
        //
    }

    private renderStyle()
    {
        //
    }
}
