import { aryRemoveItem, cn, Sides } from "@iyio/common";
import { classNamePrefix, toSafeSvgAttValue } from "./svg-charts-lib.js";
import { SvgChartCtrlOptions } from "./svg-charts-types.js";
import { SvgBaseChartCtrl } from "./SvgBaseChartCtrl.js";

interface Bar
{
    group:SVGGElement;
    data:number[];
    index:number;
}

export class SvgBarChartCtrl extends SvgBaseChartCtrl
{

    public constructor(options?:SvgChartCtrlOptions|null, svg?:SVGSVGElement, skipRender?:boolean)
    {
        super(options,svg,true);

        if(!skipRender){
            this.render();
        }
    }

    private readonly lines:Bar[]=[];
    protected renderData():void
    {
        while(this.lines.length>0/*this.renderOptions.valueCount*/){
            this.removeLine(this.lines[this.lines.length-1]);
        }

        for(let i=0;i<this.data.series.length;i++){
            const data=this.data.series[i];
            if(!data){
                continue;
            }
            if(this.lines.length<=i){
                const group=document.createElementNS('http://www.w3.org/2000/svg','g');
                const classes={
                    [`${classNamePrefix}odd`]:i%2?false:true,
                    [`${classNamePrefix}even`]:i%2?true:false,
                    [`${classNamePrefix}${i+1}`]:true,
                }
                group.setAttribute('class',cn(`${classNamePrefix}bar`,classes));
                const line:Bar={
                    group,
                    data,
                    index:i
                }
                this.canvas.appendChild(group);
                this.lines.push(line);
            }
            this.updateBar(this.lines[i]);
        }

    }

    private updateBar(bar:Bar|undefined)
    {
        if(!bar){
            return;
        }
        const style=this.getSeriesStyle(bar.index);

        const count=(this.data.series[0]?.length??0)-1;
        const {width,height,min,diff}=this.renderOptions;
        const dist=width/count;


        while(bar.group.children.length>bar.data.length){
            bar.group.children[bar.group.children.length-1]?.remove();
        }

        for(let i=0;i<bar.data.length;i++){

            let rect=bar.group.children[i];
            if(!rect){
                rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
                rect.setAttribute('class','svg-charts-fill')
                bar.group.appendChild(rect);
            }

            const v=bar.data[i]??0;
            const x=dist*i;
            const y=height-((v-min)/diff*height);
            rect.setAttribute('x',toSafeSvgAttValue((x-style.thickness/2)));
            rect.setAttribute('y',toSafeSvgAttValue(y));
            rect.setAttribute('width',toSafeSvgAttValue(style.thickness));
            rect.setAttribute('height',toSafeSvgAttValue((height-y)));
            rect.setAttribute('rx',toSafeSvgAttValue(style.cornerRadius));
        }
    }

    private removeLine(line:Bar|undefined){
        if(!line){
            return;
        }
        line.group.remove();
        aryRemoveItem(this.lines,line);
    }

    protected override getRenderPadding(preCanvasWidth:number): Sides {
        const count=this.data.labels.length;
        const m=count<2?preCanvasWidth/2:(preCanvasWidth/(count-1)/2)
        return {
            left:m,
            right:m,
            top:0,
            bottom:0,
        }
    }
}
