import { aryRemoveItem, cn, formatNumberWithBases } from "@iyio/common";
import { SvgBaseChartCtrl } from "./SvgBaseChartCtrl";
import { findPathIntersections } from "./path-intersection";
import { classNamePrefix } from "./svg-charts-lib";
import { ChartIntersection, SvgChartCtrlOptions } from "./svg-charts-types";

interface Line
{
    group:SVGGElement;
    path:SVGPathElement;
    dot:SVGCircleElement;
    text:SVGTextElement;
    fillPath:SVGPathElement;
    data:number[];
    index:number;
}

export class SvgLineChartCtrl extends SvgBaseChartCtrl
{

    private hoverPath=document.createElementNS('http://www.w3.org/2000/svg','path');

    public constructor(options?:SvgChartCtrlOptions|null, svg?:SVGSVGElement, skipRender?:boolean)
    {
        super(options,svg,true);

        this.options = {
            enableSnapping: false, // Default to false
            ...(options ?? {}),
        };

        this.svg.addEventListener('mousemove',this.mouseListener);
        this.svg.addEventListener('mouseleave',this.mouseOutListener);

        this.hoverPath.classList.add('svg-charts-value-line');
        this.hoverPath.style.visibility='hidden';
        this.svg.insertBefore(this.hoverPath,this.svg.childNodes[0]);

        if(!skipRender){
            this.render();
        }
    }

    protected override _dispose(): void {
        super._dispose();
        this.hoverPath.remove();
        this.svg.removeEventListener('mousemove',this.mouseListener);
    }

    private readonly mouseOutListener=()=>{

        for(const line of this.lines){
            line.text.style.visibility='hidden';
            line.dot.style.visibility='hidden';
            this.hoverPath.style.visibility='hidden';
        }

        this.setIntersections([]);
    }

    private readonly mouseListener=(e:MouseEvent)=>{

        if(this.options.min && !this.options.showOverlaysWithMin){
            return;
        }

        const ro=this.renderOptions;

        const rect=this.svg.getBoundingClientRect();
        const left=rect.left+ro.left;
        const transform=`translate(${ro.left},${ro.top})`;
        this.hoverPath.setAttribute('transform',transform);

        const x=e.clientX-left;
        const path=`M${x} 0 L${x} ${ro.canvasHeight}`
        this.hoverPath.setAttribute('d',path);

        const intersections:ChartIntersection[]=[];

        for(const line of this.lines){


            //console.log(line.path.getAttribute('d'),this.debugPath.getAttribute('d'))
            const inter=findPathIntersections(line.path.getAttribute('d')??'',this.hoverPath.getAttribute('d')??'',false);
            if(inter?.length){
                const {x,y}=inter[0];
                const offset=10;

                // Handle snapping if enabled
            if (this.options.enableSnapping) {
                // Find the nearest data point index
                const nearestIndex = this.findNearestDataPointIndex(x, line.data);
                const nearestX = (ro.width / (line.data.length - 1)) * nearestIndex;
                
                // Get the point on the actual path at this x coordinate
                const pathLength = line.path.getTotalLength();
                let bestPoint = { x: 0, y: 0 };
                let bestDistance = Infinity;
                
                // Sample points along the path to find the closest point at our x coordinate
                for (let i = 0; i <= pathLength; i++) {
                    const point = line.path.getPointAtLength(i);
                    const distance = Math.abs(point.x - nearestX);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestPoint = point;
                    }
                }

                // Use the y-coordinate from the actual path
                line.dot.setAttribute('cx', nearestX.toString());
                line.dot.setAttribute('cy', bestPoint.y.toString());
                line.text.setAttribute('x', (nearestX + 10).toString());
                line.text.setAttribute('y', (bestPoint.y + 10).toString());
                line.text.innerHTML = formatNumberWithBases(line.data[nearestIndex], 100);

                line.text.style.visibility = 'hidden';
                line.dot.style.visibility = 'visible';
                this.hoverPath.style.visibility = 'visible';

                const timestamp = this.data.timestamps?.[line.index]?.[nearestIndex];

                intersections.push({
                    x: nearestX,
                    y: bestPoint.y,
                    clientX: rect.x + ro.left + nearestX,
                    clientY: rect.y + ro.top + bestPoint.y,
                    value: line.data[nearestIndex],
                    valueClass: line.dot.getAttribute('class') ?? '',
                    timestamp: timestamp
                });
            } else {
                line.dot.setAttribute('cx',x.toString());
                line.dot.setAttribute('cy',y.toString());
                if(this.options.showIntersectionValues){
                    line.text.setAttribute('x',(x+offset).toString());
                    line.text.setAttribute('y',(y+offset).toString());
                    line.text.style.visibility='visible';
                }else{
                    line.text.style.visibility='hidden';
                }
                line.dot.style.visibility='visible';
                this.hoverPath.style.visibility='visible';
                const value=(1-y/ro.canvasHeight)*(ro.max-ro.min)+ro.min;
                line.text.innerHTML=formatNumberWithBases(value,100);

                const index = Math.round((x / ro.width) * (line.data.length - 1));
                const timestamp = this.data.timestamps?.[line.index]?.[index];

                intersections.push({
                    x,
                    y,
                    clientX:rect.x+ro.left+x,
                    clientY:rect.y+ro.top+y,
                    value,
                    valueClass:line.dot.getAttribute('class')??'',
                    timestamp: timestamp
                })
                }
            }else{
                line.text.style.visibility='hidden';
                line.dot.style.visibility='hidden';
                this.hoverPath.style.visibility='hidden';
            }
        }

        this.setIntersections(intersections);
    }

    private readonly lines:Line[]=[];
    protected renderData():void
    {
        while(this.lines.length>0/*this.renderOptions.valueCount*/){
            this.removeLine(this.lines[this.lines.length-1]);
        }

        for(let i=0;i<this.data.series.length;i++){
            const data=this.data.series[i];
            if(this.lines.length<=i){
                const group=document.createElementNS('http://www.w3.org/2000/svg','g');
                const path=document.createElementNS('http://www.w3.org/2000/svg','path');
                const fillPath=document.createElementNS('http://www.w3.org/2000/svg','path');
                const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
                const text=document.createElementNS('http://www.w3.org/2000/svg','text');
                const classes={
                    [`${classNamePrefix}odd`]:i%2?false:true,
                    [`${classNamePrefix}even`]:i%2?true:false,
                    [`${classNamePrefix}${i+1}`]:true,
                }
                group.setAttribute('class',cn(`${classNamePrefix}line`,classes));
                path.setAttribute('class',cn(`${classNamePrefix}path`,classes));
                fillPath.setAttribute('class',cn(`${classNamePrefix}fill`,classes));
                dot.setAttribute('class',cn(`${classNamePrefix}dot`,classes));
                text.setAttribute('class',cn(`${classNamePrefix}text svg-charts-text`,classes));
                text.style.visibility='hidden';
                dot.style.visibility='hidden';
                dot.setAttribute('r','6');
                group.appendChild(fillPath);
                group.appendChild(path);
                group.appendChild(dot);
                group.appendChild(text);
                const line:Line={
                    group,
                    path,
                    fillPath,
                    data,
                    dot,
                    text,
                    index:i
                }
                this.canvas.appendChild(group);
                this.lines.push(line);
            }else{
                this.lines[i].data=data;
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

    private findNearestDataPointIndex(x: number, data: number[]): number {
        const ro = this.renderOptions;
        const step = ro.width / (data.length - 1);
        const index = Math.round((x - ro.left) / step);
        return Math.min(Math.max(index, 0), data.length - 1);
    }
}
