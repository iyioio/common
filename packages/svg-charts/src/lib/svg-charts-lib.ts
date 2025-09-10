import { Rect } from "@iyio/common";
import { ChartData } from "./svg-charts-types.js";

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

let nextId=1;
export const generateRandomChartId=()=>{
    return `svg-chart-${nextId++}-${Date.now()}-${Math.round(Math.random()*999999)}`
}

export const getDefaultChartSteps=():number[]=>{
    const steps=[0.001,0.01,0.1];
    const ns=[1,2,3,5];
    let base=1;
    for(let i=0;i<10;i++){
        for(const n of ns){
            const v=n*base;
            if(v>0 && isFinite(v)){
                steps.push(v)
            }
        }
        base*=10;
    }
    return steps;
}

export const toSafeSvgAttValue=(value:any)=>{
    value=Number(value?.toString()||'0');
    if(!isFinite(value)){
        return '0';
    }
    return value.toString();

}
