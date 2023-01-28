import { SvgBarChartCtrl, SvgChartCtrlOptions } from "@iyio/svg-charts";
import { BaseSvgChartView, BaseSvgChartViewProps } from "./BaseSvgChartView";

const createChart=(svg:SVGSVGElement,options:Partial<SvgChartCtrlOptions>)=>new SvgBarChartCtrl(options,svg);

export function BarSvgChartView(props:BaseSvgChartViewProps){

    return (
        <BaseSvgChartView
            {...props}
            chartType="SvgBarChart"
            createChart={createChart}/>
    )

}
