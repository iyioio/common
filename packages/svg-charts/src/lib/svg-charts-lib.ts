import { Rect } from "@iyio/common";
import { ChartData } from "./svg-charts-types";

export const classNamePrefix='svg-charts-';

export const createEmptyChartData=():ChartData=>({
    labels:[],
    series:[],
})

export const getViewBoxRect=(viewBox:string|SVGAnimatedRect|null|undefined):Rect=>{
    if(!viewBox){
        return {width:0,height:0,x:0,y:0}
    }

    if(typeof viewBox === 'string'){
        const parts=viewBox.split(/\w+/);
        if(parts.length!==4){
            return {width:0,height:0,x:0,y:0}
        }

        const x=Number(parts[0]);
        const y=Number(parts[1]);
        const w=Number(parts[2]);
        const h=Number(parts[3]);

        if(isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)){
            return {width:0,height:0,x:0,y:0}
        }

        return {
            x,
            y,
            width:w-x,
            height:h-y,
        }
    }else{
        return {
            x:viewBox.baseVal.x,
            y:viewBox.baseVal.y,
            width:viewBox.baseVal.width,
            height:viewBox.baseVal.height,
        }
    }
}
