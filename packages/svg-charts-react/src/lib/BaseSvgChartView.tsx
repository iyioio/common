import { BaseLayoutOuterProps, bcn } from "@iyio/common";
import { useAlphaId } from "@iyio/react-common";
import { SvgBaseChartCtrl, SvgChartCtrlOptions } from "@iyio/svg-charts";
import { CSSProperties, useEffect, useRef, useState } from "react";

export interface BaseSvgChartViewProps extends BaseLayoutOuterProps
{
    options?:SvgChartCtrlOptions;
    style?:CSSProperties;
}

export function BaseSvgChartView({
    chartType,
    createChart,
    options,
    style,
    ...props
}:BaseSvgChartViewProps & {
    chartType:string;
    createChart:(svg:SVGSVGElement,options:Partial<SvgChartCtrlOptions>)=>SvgBaseChartCtrl;
}){

    const [svg,setSvg]=useState<SVGSVGElement|null>(null);
    const [ctrl,setCtrl]=useState<SvgBaseChartCtrl|null>(null);
    const currentOptions=useRef(options);
    const id=useAlphaId();

    useEffect(()=>{
        if(!svg){
            return;
        }
        const ctrl=createChart(svg,{
            id,
            ...currentOptions.current,
        });
        setCtrl(ctrl);
        return ()=>{
            ctrl.dispose();
        }
    },[svg,id,createChart]);

    useEffect(()=>{
        if(!ctrl || !options || options===currentOptions.current){
            return;
        }

        ctrl.options={
            id,
            ...currentOptions.current,
        }
    },[options,ctrl]);

    return (
        <>
            <svg viewBox="0 0 200 100" className={bcn(props,"BaseSvgChartView",chartType)} ref={setSvg} style={style}/>
        </>
    )

}
