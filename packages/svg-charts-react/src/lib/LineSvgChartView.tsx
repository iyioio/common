import { SvgChartCtrlOptions, SvgLineChartCtrl } from "@iyio/svg-charts";
import { BaseSvgChartView, BaseSvgChartViewProps } from "./BaseSvgChartView";

const createChart=(svg:SVGSVGElement,options:Partial<SvgChartCtrlOptions>)=>new SvgLineChartCtrl(options,svg);

export function LineSvgChartView(props:BaseSvgChartViewProps){

    return (
        <BaseSvgChartView
            {...props}
            chartType="SvgLineChart"
            createChart={createChart}/>
    )

}
