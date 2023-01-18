import { aryRemoveItem, cn } from "@iyio/common";
import { classNamePrefix } from "./svg-charts-lib";
import { SvgBaseChartCtrl } from "./SvgBaseChartCtrl";

interface Line
{
    group:SVGGElement;
    path:SVGPathElement;
    fillPath:SVGPathElement;
    data:number[];
    index:number;
}

export class SvgLineChartCtrl extends SvgBaseChartCtrl
{

    private readonly lines:Line[]=[];

    protected renderData():void
    {
        while(this.lines.length>this.renderOptions.valueCount){
            this.removeLine(this.lines[this.lines.length-1]);
        }

        for(let i=0;i<this.data.series.length;i++){
            const data=this.data.series[i];
            if(this.lines.length<=i){
                const group=document.createElementNS('http://www.w3.org/2000/svg','g');
                const path=document.createElementNS('http://www.w3.org/2000/svg','path');
                const fillPath=document.createElementNS('http://www.w3.org/2000/svg','path');
                const classes={
                    [`${classNamePrefix}odd`]:i%2?false:true,
                    [`${classNamePrefix}even`]:i%2?true:false,
                    [`${classNamePrefix}${i+1}`]:true,
                }
                group.setAttribute('class',cn(`${classNamePrefix}line`,classes));
                path.setAttribute('class',cn(`${classNamePrefix}path`,classes));
                fillPath.setAttribute('class',cn(`${classNamePrefix}fill`,classes));
                group.appendChild(fillPath);
                group.appendChild(path);
                const line:Line={
                    group,
                    path,
                    fillPath,
                    data,
                    index:i
                }
                this.canvas.appendChild(group);
                this.lines.push(line);
            }
            this.updateLine(this.lines[i]);
        }

    }

    private updateLine(line:Line)
    {
        const style=this.getSeriesStyle(line.index);

        const count=(this.data.series[0]?.length??0)-1;
        const {width,height,min,diff}=this.renderOptions;
        const dist=width/count;

        const strPoints:string[]=[];

        const cDiff=dist*0.5*style.smoothness;
        let px=0;
        let py=0;
        let p0:string='';


        for(let i=0;i<line.data.length;i++){

            const v=line.data[i];
            const x=dist*i;
            const y=height-((v-min)/diff*height);
            if(i===0){
                p0=`${x} ${y}`;
                strPoints.push('M '+p0)
            }else if(style.smoothness===0){
                strPoints.push(`L ${x} ${y}`)
            }else{
                strPoints.push(`C ${px+cDiff} ${py} ${x-cDiff} ${y} ${x} ${y}`)
            }
            px=x;
            py=y;
        }

        line.path.setAttribute('d',strPoints.join(' '));

        strPoints.push(`L ${width} ${height} L 0 ${height} L ${p0}`);
        line.fillPath.setAttribute('d',strPoints.join(' '));
    }

    private removeLine(line:Line){
        line.group.remove();
        aryRemoveItem(this.lines,line);
    }
}
