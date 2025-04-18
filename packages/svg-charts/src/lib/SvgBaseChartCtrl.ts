import { deepCompare, escapeHtml, formatNumberWithBases, ReadonlySubject, Sides, Size } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { classNamePrefix, createEmptyChartData, generateRandomChartId, getDefaultChartSteps, getViewBoxRect, toSafeSvgAttValue } from "./svg-charts-lib";
import { ChartData, ChartIntersection, ChartRenderOptions, SeriesOptions, SvgChartCtrlOptions } from "./svg-charts-types";

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

    private readonly styleElem:HTMLStyleElement;

    private _data:ChartData;
    public get data(){return this._data}
    public set data(value:ChartData){
        if(this._data===value || (this._data?.renderId && this._data.renderId===value.renderId)){
            return
        }
        this._data=value;
        this.render();
    }

    private _seriesOptions:Partial<SeriesOptions>[]=[];
    public get seriesOptions(){return this._seriesOptions}
    public set seriesOptions(value:Partial<SeriesOptions>[]){
        if(this._seriesOptions===value){return}
        this._seriesOptions=value;
        this.filledSeriesOptions=value.map(s=>this.fillSeriesStyle(s));
        this.render();
    }

    private _options:Required<Omit<SvgChartCtrlOptions,'seriesOptions'|'data'|'showOverlaysWithMin'>>;
    public get options(){return {...this._options}}
    public set options(value:Partial<SvgChartCtrlOptions>){
        this.setOptions(value);
    }

    private _canvasPadding:Sides;
    public get canvasPadding(){return this._canvasPadding}
    public set canvasPadding(value:Sides){
        if(this._canvasPadding===value){return}
        this._canvasPadding=value;
        this.render();
    }

    public get id(){return this._options.id}

    private _viewBox:Size={width:1,height:1};
    public get viewBox(){return this._viewBox}

    private _renderOptions:ChartRenderOptions;
    public get renderOptions(){return this._renderOptions}


    public constructor(options?:SvgChartCtrlOptions|null, svg?:SVGSVGElement, skipRender?:boolean)
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

        this.styleElem=document.createElement('style');
        this.svg.appendChild(this.styleElem);

        this._data=options?.data??createEmptyChartData();

        this.seriesOptions=options?.seriesOptions??[];

        const min=options?.min??false;

        this._options={
            id:options?.id??(this.svg.id||generateRandomChartId()),
            hLines:!min,
            hLinesFullWidth:false,
            vLines:!min,
            hLineSpacing:50,
            labelHAlignment:'left',
            labelVAlignment:'bottom',
            zoom:1,
            viewBox:null,
            showLabelLabels:!min,
            showValueLabels:!min,
            stack:false,
            vLinePadding:0,
            css:'',
            className:options?.className??null,
            showIntersectionValues:options?.showIntersectionValues??false,
            autoResize:true,
            removeElementsOnDispose:true,
            min,
            steps:options?.steps??getDefaultChartSteps(),
            enableSnapping: false,
            ...(options??{}),
        }

        this._canvasPadding=this._options.min?{left:5,right:5,top:5,bottom:5}:{left:60,right:35,top:35,bottom:35}

        this._renderOptions=this.getRenderOptions();

        this.updateCss();
        if(!skipRender){
            this.render();
        }

        window.addEventListener('resize',this.onResize);
        if(window.ResizeObserver){
            let size={width:this.svg.clientWidth,height:this.svg.clientHeight};
            this.resizeObserver=new ResizeObserver(()=>{
                if(!this.resizeObserved){
                    this.resizeObserved=true;
                    window.removeEventListener('resize',this.onResize);
                }
                if(size.width!==this.svg.clientWidth || size.height!==this.svg.clientHeight){
                    size={width:this.svg.clientWidth,height:this.svg.clientHeight};
                    this.render();
                }
            })
            this.resizeObserver.observe(this.svg);
        }else{
            this.resizeObserver=null;
        }
    }

    private readonly resizeObserver:ResizeObserver|null;
    private resizeObserved=false;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this._dispose();
        window.removeEventListener('resize',this.onResize);
        this.resizeObserver?.unobserve(this.svg);
        this.resizeObserver?.disconnect();
        if(this._options.removeElementsOnDispose){
            this.root.remove();
            this.styleElem.remove();
        }
    }

    protected _dispose()
    {
        // do nothing
    }

    private readonly onResize=()=>{
        if(this._options.autoResize){
            this.render();
        }
    }

    private prevClassName:string|null=null;
    private updateCss()
    {
        this.styleElem.innerHTML=this.parseCss(this._options.css,this._options.id);
        this.svg.id=this._options.id;
        if(this.prevClassName!==this._options.className){
            if(this.prevClassName){
                this.svg.classList.remove(this.prevClassName);
            }
            if(this._options.className){
                this.svg.classList.add(this._options.className);
            }
        }
    }

    private parseCss(css:string,id:string)
    {
        if(id){
            id='#'+id;
        }
        return css.split('@@').join(id);
    }

    private setOptions(value:Partial<SvgChartCtrlOptions>,skipRender=false){
        if(!value){
            return;
        }
        let changed=false;
        let updateCss=false;
        this.pauseRender=true;
        try{
            for(const e in value){
                const v=(value as any)[e];
                let _continue=true;
                switch(e as keyof SvgChartCtrlOptions){

                    case 'data':
                        if(v!==this._data){
                            changed=true;
                            this.data=v;
                        }
                        break;

                    case 'seriesOptions':{
                        const current=this.filledSeriesOptions;
                        this.seriesOptions=v;
                        if(!deepCompare(current,this.filledSeriesOptions)){
                            changed=true;
                        }
                        break;
                    }

                    case 'className':
                    case 'id':
                    case 'css':
                        if(value.id!==this._options.id || value.css!==this._options.css){
                            updateCss=true;
                        }
                        break;

                    default:
                        _continue=false;
                        break;
                }
                if(_continue){
                    (this._options as any)[e]=v;
                    continue;
                }
                if(e===undefined || (this._options as any)[e]===v){
                    continue;
                }
                changed=true;
                (this._options as any)[e]=v;

            }
        }finally{
            this.pauseRender=false;
        }
        if(updateCss){
            this.updateCss();
        }
        if(changed && !skipRender){
            this.render();
        }
    }



    protected getRenderOptions():ChartRenderOptions
    {
        const valueCount=this.data?.series?.[0]?.length??0;

        const preCanvasWidth=Math.max(0,this._viewBox.width-this._canvasPadding.left-this._canvasPadding.right)||1;
        const preCanvasHeight=Math.max(0,this._viewBox.height-this._canvasPadding.top-this._canvasPadding.bottom)||1;
        const renderPadding=this.getRenderPadding(preCanvasWidth,preCanvasHeight);

        const width=Math.max(0,this._viewBox.width-this._canvasPadding.left-this._canvasPadding.right-renderPadding.left-renderPadding.right)||1;
        const height=Math.max(0,this._viewBox.height-this._canvasPadding.top-this._canvasPadding.bottom-renderPadding.top-renderPadding.bottom)||1;


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

        if(min>0){
            min--;
        }

        const hLineSpacingPx=this._options.hLineSpacing;
        let hLineSpacing=-1;

        const layoutScale=(this.svg.clientHeight||1)/this._viewBox.height;
        const canvasHeightPx=height*layoutScale;
        let hLineCount=Math.ceil(canvasHeightPx/hLineSpacingPx);
        let valueStep=-1;

        let diff=max-min;
        const steps=this._options.steps;

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
                    if(step<1 && diff>=1){
                        break;
                    }
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

        if(diff>3 && diff%(hLineCount-1)){
            const startLineCount=hLineCount;
            while(diff%(hLineCount-1) && hLineCount){
                hLineCount--;
            }
            if(!hLineCount || startLineCount-hLineCount>6){
                hLineCount=startLineCount;
            }
        }


        if(hLineSpacing===-1){
            hLineSpacing=height/(hLineCount-1);//Math.floor(hLineSpacingPx/layoutScale);
        }
        if(valueStep===-1){
            valueStep=diff/(hLineCount-1);
        }

        const left=this._canvasPadding.left+renderPadding.left;
        const top=this._canvasPadding.top+renderPadding.top;
        const right=this._viewBox.width-this.canvasPadding.right-renderPadding.right;
        const bottom=this._viewBox.height-this.canvasPadding.bottom-renderPadding.bottom;


        return {
            min,
            max,
            diff,
            width,
            height,
            hLineSpacing,
            valueCount,
            hLineCount,
            left,
            top,
            right,
            bottom,
            viewBoxWidth:this._viewBox.width,
            viewBoxHeight:this._viewBox.height,
            valueStep,
            renderPadding,

            canvasWidth:width+renderPadding.left+renderPadding.right,
            canvasHeight:height+renderPadding.top+renderPadding.bottom,
            canvasLeft:left-renderPadding.left,
            canvasRight:right+renderPadding.right,
            canvasTop:top-renderPadding.top,
            canvasBottom:bottom+renderPadding.bottom,
        }
    }

    private pauseRender=false;
    public render()
    {
        if(this.pauseRender || !this._options){
            return;
        }
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
        this.canvas.setAttribute('transform',`translate(${this._renderOptions.left},${this._renderOptions.top})`);
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
            canvasLeft:left,
            canvasRight:right,
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

                line.setAttribute('x1',toSafeSvgAttValue(hLinesFullWidth?0:left));
                line.setAttribute('x2',toSafeSvgAttValue(hLinesFullWidth?this.viewBox.width:right));
                line.setAttribute('y1',toSafeSvgAttValue(y));
                line.setAttribute('y2',toSafeSvgAttValue(y));

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
                line.setAttribute('y1',toSafeSvgAttValue(top));
                line.setAttribute('y2',toSafeSvgAttValue(bottom));
                line.setAttribute('x1',toSafeSvgAttValue(x));
                line.setAttribute('x2',toSafeSvgAttValue(x));
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
            canvasBottom:bottom,
            canvasLeft:left,
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
                const text=escapeHtml(formatNumberWithBases(value))
                obj.innerHTML=`
                    <div class="${className}" title="${text}" style="width:${lw}px;height:${h}px">
                        <div>${text}</div>
                    </div>
                `

                obj.setAttribute('x','0');
                obj.setAttribute('y',toSafeSvgAttValue((y-hLineSpacing)));
                obj.setAttribute('width',toSafeSvgAttValue(lw));
                obj.setAttribute('height',toSafeSvgAttValue(h));


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
            bottom,
            renderPadding
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

            const validLabels: SVGForeignObjectElement[] = [];

            for(let i=0;i<valueCount;i++){
                const labelText = this.data.labels[i] ?? '';
                if(!labelText) {
                    continue;
                }

                const isFirst=i===0 && renderPadding.left<20;
                const isLast=i===valueCount-1 && renderPadding.right<20;
                
                let obj: SVGForeignObjectElement;
                if(this.vLabels.length<=i){
                    obj=document.createElementNS('http://www.w3.org/2000/svg','foreignObject');
                    obj.setAttribute('class',`${classNamePrefix}label-label`);
                    this.vLabelGroup.appendChild(obj);
                    this.vLabels.push(obj);
                } else {
                    obj = this.vLabels[i];
                }

                const w=(width/(valueCount-1));
                const lw = w * (isFirst || isLast ? 3 : 3);
                const h=viewBoxHeight-bottom;
                
                const className=`${classNamePrefix}text ${classNamePrefix}text-label ${isFirst?` ${classNamePrefix}text-first`:isLast?` ${classNamePrefix}text-last`:''}`;
                const text=escapeHtml(labelText);
                obj.innerHTML=`
                    <div class="${className}" title="${text}" style="width:${lw}px;height:${h}px">
                        <div>${text}</div>
                    </div>
                `;

                const x=w*i+left;
                obj.setAttribute('y',toSafeSvgAttValue(bottom));
                obj.setAttribute('x',toSafeSvgAttValue((isFirst?x:isLast?x-lw:x-lw/2)));
                obj.setAttribute('width',toSafeSvgAttValue(lw));
                obj.setAttribute('height',toSafeSvgAttValue(h));

                validLabels.push(obj);
            }

            this.vLabels.forEach(label => {
                if(!validLabels.includes(label)) {
                    label.remove();
                }
            });

            this.vLabels = validLabels;

        }else if(this.vLabelGroup){
            this.vLabelGroup.remove();
            this.vLabelGroup=null;
            this.vLabels=[];
        }
    }

    private filledSeriesOptions:SeriesOptions[]=[];
    protected fillSeriesStyle(style:Partial<SeriesOptions>):SeriesOptions
    {
        return {
            ...this.getDefaultSeriesStyle(),
            ...style
        }
    }

    protected getDefaultSeriesStyle():SeriesOptions
    {
        return {
            smoothness:0,
            thickness:30,
            margin:20,
            cornerRadius:0,
        }
    }

    public getSeriesStyle(index:number):SeriesOptions
    {
        return this.filledSeriesOptions[index%this.filledSeriesOptions.length]??this.fillSeriesStyle({});
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected getRenderPadding(preCanvasWidth:number,preCanvasHeight:number):Sides
    {
        return {left:0,right:0,top:0,bottom:0}
    }

    private readonly _intersections:BehaviorSubject<ChartIntersection[]>=new BehaviorSubject<ChartIntersection[]>([]);
    public get intersectionsSubject():ReadonlySubject<ChartIntersection[]>{return this._intersections}
    public get intersections(){return this._intersections.value}

    protected setIntersections(intersections:ChartIntersection[]){

        this._intersections.next(intersections);

    }
}
