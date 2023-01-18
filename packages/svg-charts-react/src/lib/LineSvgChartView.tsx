import { BaseLayoutOuterProps, bcn } from "@iyio/common";
import { createEmptyChartData, SvgBaseChartCtrl, SvgChartCtrlOptions, SvgLineChartCtrl } from "@iyio/svg-charts";
import { CSSProperties, useEffect, useRef, useState } from "react";

interface SvgChartViewProps extends BaseLayoutOuterProps
{
    options?:SvgChartCtrlOptions;
    style?:CSSProperties;
}

export function LineSvgChartView({
    options,
    style,
    ...props
}:SvgChartViewProps){

    const [svg,setSvg]=useState<SVGSVGElement|null>(null);
    const [ctrl,setCtrl]=useState<SvgBaseChartCtrl|null>(null);
    const initOptions=useRef(options)

    useEffect(()=>{
        if(!svg){
            return;
        }

        const ctrl=new SvgLineChartCtrl(initOptions.current,svg);
        ctrl.render();
        setCtrl(ctrl);
        return ()=>{
            ctrl.dispose();
        }
    },[svg]);

    const {
        data,
        style: chartStyle
    }=(options??{})

    useEffect(()=>{
        if(!ctrl){
            return;
        }
        ctrl.data=data??createEmptyChartData();
    },[data,ctrl]);

    useEffect(()=>{
        if(!ctrl){
            return;
        }
        ctrl.style=chartStyle??{}
    },[chartStyle,ctrl]);

    return (
        <>
            <svg viewBox="0 0 200 100" className={bcn(props,"SvgChartView")} ref={setSvg} style={style}>
                {/* <path strokeLinecap="" /> */}
            </svg>
            <style global jsx>{`
                .SvgChartView .svg-charts-label-line, .SvgChartView .svg-charts-value-line{
                    stroke:#313336;
                    stroke-width:1px;
                }

                .SvgChartView .svg-charts-text{
                    color:#ffffff;
                }

                .SvgChartView .svg-charts-line.svg-charts-odd .svg-charts-path{
                    display:none;
                }
                .SvgChartView .svg-charts-line.svg-charts-odd .svg-charts-fill{
                    fill:#4085F812;
                }

                .SvgChartView .svg-charts-line.svg-charts-even .svg-charts-path{
                    stroke:#4085F8;
                    stroke-width:5px;
                    fill:none;
                    stroke-linecap:round;
                }
                .SvgChartView .svg-charts-line.svg-charts-even .svg-charts-fill{
                    display:none;
                }

                .SvgChartView .svg-charts-text-label{
                    display:flex;
                    justify-content:center;
                    align-items:center;
                    padding:0 5px;
                    box-sizing:border-box;
                }
                .SvgChartView .svg-charts-text-label > div{
                    overflow:hidden;
                    white-space:nowrap;
                    text-overflow:ellipsis;
                }
                .SvgChartView .svg-charts-label-label .svg-charts-text-first{
                    justify-content:flex-start;
                }
                .SvgChartView .svg-charts-label-label .svg-charts-text-last{
                    justify-content:flex-end;
                }
                .SvgChartView .svg-charts-value-label .svg-charts-text-label{
                    justify-content:flex-end;
                    align-items:flex-end;
                }
            `}</style>
        </>
    )

}
