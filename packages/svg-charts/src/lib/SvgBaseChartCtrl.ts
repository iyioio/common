import { escapeHtml, Sides, Size } from "@iyio/common";
import { classNamePrefix, createEmptyChartData, getViewBoxRect } from "./svg-charts-lib";
import { ChartData, ChartRenderOptions, ChartStyle, SeriesStyle, SvgChartCtrlOptions } from "./svg-charts-types";

const steps=[0.001,0.01,0.1,1,2,5,10,20,50,100]

export abstract class SvgBaseChartCtrl
{
    public readonly svg:SVGSVGElement;

    /**
     * Contains all child elements of the chart
     */
    public readonly root:SVGGElement;

    /**
     * The area where the main content of the chart is drawn. Labels an other decorators will be
     * drawn around the canvas.
     */
    public readonly canvas:SVGGElement;

    private _data:ChartData;
    public get data(){return this._data}
    public set data(value:ChartData){
        if(this._data===value){return}
        this._data=value;
        this.render();
    }

    private _style:ChartStyle;
    public get style(){return this._style}
    public set style(value:ChartStyle){
        if(this._style===value){return}
        this._style=value;
        this.seriesStyle=(value.series??[]).map(s=>this.fillSeriesStyle(s));
        this.render();
    }

    private _options:Required<SvgChartCtrlOptions>;

    private _canvasPadding:Sides={left:60,right:35,top:35,bottom:35};
    public get canvasPadding(){return this._canvasPadding}
    public set canvasPadding(value:Sides){
        if(this._canvasPadding===value){return}
        this._canvasPadding=value;
        this.render();
    }

    private _viewBox:Size={width:1,height:1};
    public get viewBox(){return this._viewBox}

    private _renderOptions:ChartRenderOptions;
    public get renderOptions(){return this._renderOptions}


    public constructor(options?:SvgChartCtrlOptions|null, svg?:SVGSVGElement)
    {

        if(!svg){
            svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
        }

        this.svg=svg;

        this.root=document.createElementNS('http://www.w3.org/2000/svg','g');
        this.root.classList.add(classNamePrefix+'root')
        svg.appendChild(this.root);

        this.canvas=document.createElementNS('http://www.w3.org/2000/svg','g');
        this.root.classList.add(classNamePrefix+'canvas')
        this.root.appendChild(this.canvas);

        this._data=options?.data??createEmptyChartData();

        this._style=options?.style??{

        }
        this.seriesStyle=(this._style.series??[]).map(s=>this.fillSeriesStyle(s));


        this._options={

            hLines:true,
            hLinesFullWidth:false,
            vLines:true,
            hLineSpacing:50,
            labelHAlignment:'left',
            labelVAlignment:'bottom',
            zoom:1,
            viewBox:null,
            showLabelLabels:true,
            showValueLabels:true,

            ...(options??{}),

            data:this._data,
            style:this.style,
        }

        this._renderOptions=this.getRenderOptions();

    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.root.remove();
    }



    protected getRenderOptions():ChartRenderOptions
    {
        const valueCount=this.data?.series?.[0]?.length??0;

        const width=Math.max(0,this._viewBox.width-this._canvasPadding.left-this._canvasPadding.right)||1;
        const height=Math.max(0,this._viewBox.height-this._canvasPadding.top-this._canvasPadding.bottom)||1;


        let min=Number.MAX_VALUE;
        let max=Number.MIN_VALUE;

        for(const series of this.data.series){
            for(const v of series){
                if(v<min){
                    min=v;
                }
                if(v>max){
                    max=v;
                }
            }
        }

        const hLineSpacingPx=this._options.hLineSpacing;
        let hLineSpacing=-1;

        const layoutScale=(this.svg.clientHeight||1)/this._viewBox.height;
        const canvasHeightPx=height*layoutScale;
        let hLineCount=Math.ceil(canvasHeightPx/hLineSpacingPx);
        console.log('----')
        console.log({hLineCount,height,layoutScale},this.viewBox)
        let valueStep=-1;

        let diff=max-min;

        if(diff>=2){
            min=Math.floor(min);
            max=Math.ceil(max);
            diff=max-min;

            if(diff%2){
                if(min%2){
                    min-=1;
                }
                if(max%2){
                    max+=1;
                }
                diff=max-min;
            }

            for(let pass=1;pass<=2;pass++){
                const lineCountStart=hLineCount;
                for(let i=steps.length-1;i>=0;i--){
                    const step=steps[i];
                    if(diff/step>=hLineCount){
                        while(hLineCount*step<diff){
                            hLineCount++;
                        }
                        valueStep=step;
                        hLineSpacing=height/hLineCount;
                        hLineCount++;
                        break;
                    }
                }
                if(pass===1){
                    min=Math.floor(min/valueStep)*valueStep;
                    max=Math.ceil(max/valueStep)*valueStep;
                    diff=max-min
                    hLineCount=lineCountStart;
                }
            }

        }



        if(hLineSpacing===-1){
            hLineSpacing=height/(hLineCount-1);//Math.floor(hLineSpacingPx/layoutScale);
        }
        if(valueStep===-1){
            valueStep=diff/(hLineCount-1);
        }

        console.log({diff,valueStep,hLineCount,hLineSpacing})
        console.log({min,max,height,canvasHeightPx,viewBoxHeight:this._viewBox.height})


        // for(let i=1;i<steps.length;i++){
        //     const spacing=hLineCount*steps[i];
        //     if(spacing>=height){
        //         console.log({spacing},steps[i])
        //         hLineSpacing=steps[i];
        //         break;
        //     }
        // }

        return {
            min,
            max,
            diff,
            width,
            height,
            hLineSpacing,
            valueCount,
            hLineCount,
            left:this._canvasPadding.left,
            top:this._canvasPadding.top,
            right:this._viewBox.width-this.canvasPadding.right,
            bottom:this._viewBox.height-this.canvasPadding.bottom,
            viewBoxWidth:this._viewBox.width,
            viewBoxHeight:this._viewBox.height,
            valueStep
        }
    }

    public render()
    {
        if(this._options.viewBox){
            this.svg.setAttribute('viewBox',this._options.viewBox);
        }else{
            const w=this.svg.clientWidth;
            const h=this.svg.clientHeight;
            const s=this._options.zoom;
            this.svg.setAttribute(
                'viewBox',
                `${Math.floor((w*s-w)/-2)} ${Math.floor((h*s-h)/-2)} ${Math.floor(w*s)} ${Math.floor(h*s)}`
            );
        }
        const rect=getViewBoxRect(this.svg.viewBox);
        this._viewBox={width:rect.width||1,height:rect.height||1};
        this._renderOptions=this.getRenderOptions();
        this.canvas.setAttribute('transform',`translate(${this._canvasPadding.left},${this._canvasPadding.top})`);
        this.renderValueLines();
        this.renderLabelLines();
        this.renderValueLabels();
        this.renderLabelLabels();
        this.renderData();
    }

    protected abstract renderData():void;


    private hLines:SVGLineElement[]=[];
    private hLineGroup:SVGGElement|null=null;
    protected renderValueLines()
    {

        const {
            hLineCount,
            hLineSpacing,
            bottom,
            left,
            right,
        }=this.renderOptions;

        const {
            hLines,
            hLinesFullWidth
        }=this._options;

        if(hLines){
            if(!this.hLineGroup){
                this.hLineGroup=document.createElementNS('http://www.w3.org/2000/svg','g');
                this.hLineGroup.classList.add(classNamePrefix+'value-line-group');
                this.root.insertBefore(this.hLineGroup,this.canvas);
            }

            while(this.hLines.length>hLineCount){
                this.hLines.pop()?.remove();
            }

            let y=bottom;
            for(let i=0;i<=hLineCount-1;i++){
                if(this.hLines.length<=i){
                    const newLine=document.createElementNS('http://www.w3.org/2000/svg','line');
                    newLine.classList.add(classNamePrefix+'value-line');
                    this.hLineGroup.appendChild(newLine);
                    this.hLines.push(newLine);
                }
                const line=this.hLines[i];

                line.setAttribute('x1',hLinesFullWidth?'0':left.toString());
                line.setAttribute('x2',hLinesFullWidth?this.viewBox.width.toString():right.toString());
                line.setAttribute('y1',y.toString());
                line.setAttribute('y2',y.toString());

                y-=hLineSpacing;
            }

        }else if(this.hLineGroup){
            this.hLineGroup.remove();
            this.hLineGroup=null;
            this.hLines=[];
        }

    }

    private vLines:SVGLineElement[]=[];
    private vLineGroup:SVGGElement|null=null;
    protected renderLabelLines()
    {
        const {
            left,
            valueCount,
            width,
            top,
            bottom
        }=this.renderOptions;

        const {
            vLines,
        }=this._options;

        if(vLines){
            if(!this.vLineGroup){
                this.vLineGroup=document.createElementNS('http://www.w3.org/2000/svg','g');
                this.vLineGroup.classList.add(classNamePrefix+'label-line-group');
                this.root.insertBefore(this.vLineGroup,this.canvas);
            }

            while(this.vLines.length>valueCount){
                this.vLines.pop()?.remove();
            }

            for(let i=0;i<valueCount;i++){
                if(this.vLines.length<=i){
                    const newLine=document.createElementNS('http://www.w3.org/2000/svg','line');
                    newLine.classList.add(classNamePrefix+'label-line');
                    this.vLineGroup.appendChild(newLine);
                    this.vLines.push(newLine);
                }
                const line=this.vLines[i];

                const x=(width/(valueCount-1))*i+left;
                line.setAttribute('y1',top.toString());
                line.setAttribute('y2',bottom.toString());
                line.setAttribute('x1',x.toString());
                line.setAttribute('x2',x.toString());
            }

        }else if(this.vLineGroup){
            this.vLineGroup.remove();
            this.vLineGroup=null;
            this.vLines=[];
        }
    }

    private hLabelGroup:SVGGElement|null=null;
    private hLabels:SVGForeignObjectElement[]=[];
    protected renderValueLabels()
    {
        const {
            hLineCount,
            hLineSpacing,
            bottom,
            left,
            min,
            valueStep
        }=this.renderOptions;

        const {
            hLines,
        }=this._options;

        if(hLines){
            if(!this.hLabelGroup){
                this.hLabelGroup=document.createElementNS('http://www.w3.org/2000/svg','g');
                this.hLabelGroup.classList.add(classNamePrefix+'value-label-group');
                this.root.insertBefore(this.hLabelGroup,this.canvas);
            }

            while(this.hLabels.length>hLineCount){
                this.hLabels.pop()?.remove();
            }

            let y=bottom;
            let value=min;
            for(let i=0;i<=hLineCount-1;i++){
                const isFirst=i===0;
                const isLast=i===hLineCount-1;
                if(this.hLabels.length<=i){
                    const newLine=document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
                    newLine.classList.add(classNamePrefix+'value-label');
                    this.hLabelGroup.appendChild(newLine);
                    this.hLabels.push(newLine);
                }
                const obj=this.hLabels[i];
                const lw=left;
                const h=hLineSpacing;

                const className=`${classNamePrefix}text ${classNamePrefix}text-label ${isFirst?` ${classNamePrefix}text-first`:isLast?` ${classNamePrefix}text-last`:''}`;
                const text=escapeHtml((Math.round(value*1000)/1000).toString())
                obj.innerHTML=`
                    <div class="${className}" title="${text}" style="width:${lw}px;height:${h}px">
                        <div>${text}</div>
                    </div>
                `

                obj.setAttribute('x','0');
                obj.setAttribute('y',(y-hLineSpacing).toString());
                obj.setAttribute('width',lw.toString());
                obj.setAttribute('height',h.toString());

                y-=hLineSpacing;
                value+=valueStep;
            }

        }else if(this.hLabelGroup){
            this.hLabelGroup.remove();
            this.hLabelGroup=null;
            this.hLines=[];
        }
    }


    private vLabelGroup:SVGGElement|null=null;
    private vLabels:SVGForeignObjectElement[]=[];
    protected renderLabelLabels()
    {
        const {
            left,
            valueCount,
            width,
            viewBoxHeight,
            bottom
        }=this.renderOptions;

        const {
            showLabelLabels,
        }=this._options;

        if(showLabelLabels){
            if(!this.vLabelGroup){
                this.vLabelGroup=document.createElementNS('http://www.w3.org/2000/svg','g');
                this.vLabelGroup.classList.add(classNamePrefix+'label-label-group');
                this.root.insertBefore(this.vLabelGroup,this.canvas);
            }

            while(this.vLabels.length>valueCount){
                this.vLabels.pop()?.remove();
            }

            for(let i=0;i<valueCount;i++){
                const isFirst=i===0;
                const isLast=i===valueCount-1;
                if(this.vLabels.length<=i){
                    const newLine=document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
                    newLine.setAttribute('class',`${classNamePrefix}label-label`);
                    this.vLabelGroup.appendChild(newLine);
                    this.vLabels.push(newLine);
                }
                const w=(width/(valueCount-1));
                const lw=w/(isFirst||isLast?2:1);
                const h=viewBoxHeight-bottom;
                const obj=this.vLabels[i];
                const className=`${classNamePrefix}text ${classNamePrefix}text-label ${isFirst?` ${classNamePrefix}text-first`:isLast?` ${classNamePrefix}text-last`:''}`;
                const text=escapeHtml(this.data.labels[i]??'')
                obj.innerHTML=`
                    <div class="${className}" title="${text}" style="width:${lw}px;height:${h}px">
                        <div>${text}</div>
                    </div>
                `

                const x=w*i+left;
                obj.setAttribute('y',bottom.toString());
                obj.setAttribute('x',(isFirst?x:isLast?x-lw:x-lw/2).toString());
                obj.setAttribute('width',lw.toString());
                obj.setAttribute('height',h.toString());
            }

        }else if(this.vLabelGroup){
            this.vLabelGroup.remove();
            this.vLabelGroup=null;
            this.vLabels=[];
        }
    }

    private seriesStyle:SeriesStyle[]=[];
    protected fillSeriesStyle(style:Partial<SeriesStyle>):SeriesStyle
    {
        return {
            ...this.getDefaultSeriesStyle(),
            ...style
        }
    }

    protected getDefaultSeriesStyle():SeriesStyle
    {
        return {
            smoothness:0,
        }
    }

    public getSeriesStyle(index:number):SeriesStyle
    {
        return this.seriesStyle[index%this.seriesStyle.length]??this.fillSeriesStyle({});
    }
}
