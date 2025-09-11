import { delayAsync, Point, ReadonlySubject, uuid } from "@iyio/common";
import { ProtoAddressMap, protoGetNodeAtPath, ProtoLayout, protoMarkdownParseNodes, ProtoNode, ProtoPosScale } from "@iyio/protogen";
import { PanZoomCtrl } from "@iyio/react-common";
import { BehaviorSubject } from "rxjs";
import { Assistant } from "../components/Assistant.js";
import { CommandLineInterface } from "./CommandLineInterface.js";
import { LineCtrl } from "./LineCtrl.js";
import { NodeCtrl } from "./NodeCtrl.js";
import { ProtoAnchor, ProtoUiLengthStyle, SaveRequest } from "./protogen-ui-lib.js";
import { ProtoKeyListener } from "./ProtoKeyListener.js";

export class ProtogenCtrl
{

    public readonly lineCtrl:LineCtrl;
    public readonly keyListener:ProtoKeyListener;

    public readonly cli:CommandLineInterface;

    public readonly assistant:Assistant;

    public readonly nodes:BehaviorSubject<NodeCtrl[]>;

    public panZoom:PanZoomCtrl|null=null;

    public readonly pos:BehaviorSubject<ProtoPosScale>=new BehaviorSubject<ProtoPosScale>({
        x:0,
        y:0,
        scale:1
    });

    private readonly _activeAnchor:BehaviorSubject<ProtoAnchor|null>=new BehaviorSubject<ProtoAnchor|null>(null);
    public get activeAnchorSubject():ReadonlySubject<ProtoAnchor|null>{return this._activeAnchor}
    public get activeAnchor(){return this._activeAnchor.value}

    private readonly _viewDepth:BehaviorSubject<number|null>=new BehaviorSubject<number|null>(null);
    public get viewDepthSubject():ReadonlySubject<number|null>{return this._viewDepth}
    public get viewDepth(){return this._viewDepth.value}
    public set viewDepth(value:number|null){
        if(value==this._viewDepth.value){
            return;
        }
        this._viewDepth.next(value);
        this.updateViewMode();
    }

    private readonly _showOutput:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get showOutputSubject():ReadonlySubject<boolean>{return this._showOutput}
    public get showOutput(){return this._showOutput.value}
    public set showOutput(value:boolean){
        if(value==this._showOutput.value){
            return;
        }
        this._showOutput.next(value);
    }

    private readonly _output:BehaviorSubject<string>=new BehaviorSubject<string>('');
    public get outputSubject():ReadonlySubject<string>{return this._output}
    public get output(){return this._output.value}

    private readonly _lineDistances:BehaviorSubject<ProtoUiLengthStyle>=new BehaviorSubject<ProtoUiLengthStyle>({
        min:1000,
        max:3000,
        minOpacity:0.2,
    });
    public get lineDistancesSubject():ReadonlySubject<ProtoUiLengthStyle>{return this._lineDistances}
    public get lineDistances(){return this._lineDistances.value}
    public set lineDistances(value:ProtoUiLengthStyle){
        if(value==this._lineDistances.value){
            return;
        }
        this._lineDistances.next(value);
        this.lineCtrl.updateLines();
    }

    public readonly url:string;

    public constructor(code?:string,url?:string)
    {
        this.url=url??'/api/protogen'
        this.nodes=new BehaviorSubject<NodeCtrl[]>([]);

        this.lineCtrl=new LineCtrl(this);
        this.keyListener=new ProtoKeyListener(this);
        this.cli=new CommandLineInterface(this);
        this.assistant=new Assistant(this);

        window.addEventListener('mouseup',this.mouseUpListener);

        if(code){
            this.setState(code);
        }
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose(){
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;

        this.keyListener.dispose();

        window.removeEventListener('mouseup',this.mouseUpListener);

        for(const e of this.nodes.value){
            e.dispose();
        }

        this.cli.dispose();
    }

    private readonly mouseUpListener=()=>{
        setTimeout(()=>{
            const a=this.activeAnchor;
            if(!this._isDisposed && a && (Date.now()-a.time)>200){
                this._activeAnchor.next(null);
            }
        },1);
    }

    private updateViewMode()
    {
        for(const n of this.nodes.value){
            n._updateViewMode()
        }
        this.lineCtrl.updateLines();
    }

    public selectAnchor(layout:ProtoLayout,side:'left'|'right',ctrl:NodeCtrl)
    {
        const a=this._activeAnchor.value;
        if(a){
            this._activeAnchor.next(null);
            if((a.layout!==layout || a.side!==side) && layout.node && a.layout.node){
                const to=`${
                    ctrl.nodeSubject.value.name
                }${
                    layout.node.name===ctrl.nodeSubject.value.name?'':'.'+layout.node.name
                }`
                if(!a.ctrl.node.links?.some(l=>l.address===to)){
                    a.ctrl.addCodeAfterAddress(a.layout.node.address,`- $link: ${to}`,true);
                }
            }
        }else{
            this._activeAnchor.next({layout,side,ctrl,time:Date.now()});
        }
    }

    public getNodeByElem(elem:HTMLElement){
        for(const n of this.nodes.value){
            if(n.viewElem.value===elem){
                return n;
            }
        }
        return null;
    }

    public addNode(node:ProtoNode,autoFocus?:boolean|'type'):NodeCtrl
    {
        const ctrl=new NodeCtrl(node,this);
        if(autoFocus==='type'){
            ctrl.autoFocusType=true;
        }else if(autoFocus){
            ctrl.autoFocus=true;
        }
        this.clearAddressMap();
        this.nodes.next([...this.nodes.value,ctrl]);
        return ctrl;
    }

    public addNodes(code:string,autoFocus?:boolean|'type'):NodeCtrl[]
    {
        const parsingResult=protoMarkdownParseNodes(code);
        const nodes=parsingResult.rootNodes;
        const ctrls:NodeCtrl[]=[];
        this.clearAddressMap();
        for(let i=0;i<nodes.length;i++){
            const n=nodes[i];
            if(!n){
                continue;
            }
            const end=i===nodes.length-1;
            const ctrl=new NodeCtrl(n,this);
            ctrls.push(ctrl);
            if(end){
                if(autoFocus==='type'){
                    ctrl.autoFocusType=true;
                }else if(autoFocus){
                    ctrl.autoFocus=true;
                }
            }
            this.nodes.next([...this.nodes.value,ctrl]);
        }
        return ctrls;
    }

    public removeNode(node:NodeCtrl)
    {
        if(this.nodes.value.includes(node)){
            this.nodes.next(this.nodes.value.filter(e=>e!==node));
        }
        this.clearAddressMap();
        this.lineCtrl.updateLines();
    }

    public appendOutput(value:string,show=true){
        this._output.next(this._output.value+value);
        if(show && !this.showOutput){
            this.showOutput=true;
        }
    }

    public clearOutput(){
        this._output.next('');
    }

    private exporting=false;
    public async saveAsync(options:Omit<SaveRequest,'content'>={})
    {
        if(this.exporting || this._isDisposed){
            return;
        }
        this.exporting=true;
        let complete=false;

        try{

            // A workaround to first call of route not warning memory with other routes
            await fetch(`/api/protogen/output/_warmup`);

            const outputId=uuid();
            const content:string=this.nodes.value.map(e=>e.getFullCode()).join('\n\n');

            const request:SaveRequest={
                ...options,
                content,
                outputId,
            };

            (async ()=>{
                let _continue=2;
                while(_continue>0){
                    await delayAsync(200);
                    try{
                        const response=await fetch(`/api/protogen/output/${outputId}`);
                        const out:string|null=await response.json();
                        if(out!==null){
                            this.appendOutput(out);
                        }
                        if(complete){
                            _continue--;
                        }
                    }catch{/* */}
                }
            })();


            await fetch(this.url,{method:'POST',body:JSON.stringify(request)});
        }finally{
            complete=true;
            this.exporting=false;
        }
    }

    public clearState()
    {
        this.clearAddressMap();

        this.nodes.next([]);
    }

    private setStateIndex=0;

    public setState(code:string)
    {
        this.setStateIndex++;

        const parsingResult=protoMarkdownParseNodes(code);

        this.clearAddressMap();

        this.nodes.next(parsingResult.rootNodes.map(e=>(
            new NodeCtrl(e,this)
        )))
    }

    public async loadStateAsync(url:string)
    {
        const index=this.setStateIndex;

        const result=await fetch(url);
        if(this._isDisposed || index!==this.setStateIndex){return;}

        const code:string=await result.json();
        if(this._isDisposed || index!==this.setStateIndex){return;}

        this.setState(code);

    }

    private _addressMap:ProtoAddressMap|null=null;
    public get addressMap(){
        if(!this._addressMap){
            for(const node of this.nodes.value){
                node.clearRevLinks();
            }
            const map=this.createAddressMap();
            this._addressMap=map;
            for(const node of this.nodes.value){
                node.updateLinks(map);
            }
        }
        return this._addressMap;
    }
    public clearAddressMap()
    {
        this._addressMap=null;
    }

    public getNodeByAddress(address:string,relative?:ProtoNode):ProtoNode|null{
        return protoGetNodeAtPath(address,this.addressMap,relative)??null;
    }

    public createAddressMap():ProtoAddressMap
    {
        const map:ProtoAddressMap={};
        for(const node of this.nodes.value){
            node.addToAddressMap(map);
        }
        return map;
    }

    public getViewCenter():Point
    {
        if(!this.panZoom){
            return {x:0,y:0};
        }

        const w=globalThis.window?.innerWidth??0;
        const h=globalThis.window?.innerHeight??0;

        return this.panZoom.transformClientPointToPlane({x:w/2,y:h/2});

    }

    public getViewTopLeft():Point
    {
        if(!this.panZoom){
            return {x:0,y:0};
        }

        return this.panZoom.transformClientPointToPlane({x:0,y:0});

    }

    public async addNewMarkdownNodesInViewportAsync(markdown:string):Promise<NodeCtrl[]>
    {
        let ary=markdown
            .replace(/-\s*\$layout.*?(\n\n?|$)/gim,'')
            .replace(/\?\?/g,'')
            .replace(/(\n|^)(\s*)([^-#\s].{35,})/g,(_:string,start:string,space:string,v:string)=>{
                const words=v.split(' ');
                let line='';
                const lines:string[]=[];
                for(const w of words){
                    if(!w){
                        continue;
                    }
                    line+=(line?' ':'')+w;
                    if(line.length>=35){
                        lines.push(line);
                        line='';
                    }
                }
                if(line){
                    lines.push(line);
                }

                space=space.replace(/\n/g,'');

                return start+space+lines.join('\n'+space);
            })
            .split('##');
        ary.shift();

        const origin=this.getViewTopLeft();

        ary=ary.map(a=>{
            origin.x+=400;
            origin.y+=400;
            return `${a}\n\n- $layout:${Math.round(origin.x)} ${Math.round(origin.y)} ${300}`
        });

        const parsingResult=protoMarkdownParseNodes('## '+ary.join('\n## ').trim());
        const nodes=parsingResult.rootNodes;
        const ctrls=nodes.map(n=>this.addNode(n));
        const first=ctrls[0];
        if(first){
            let pos:Point=await first.getViewBoundAsync();
            let bottom=0;
            const left=pos.x;
            const cols=Math.floor(Math.sqrt(ctrls.length));
            let col=0;
            for(const ctrl of ctrls){
                ctrl.updateCodeLayout({
                    x:pos.x,
                    y:pos.y,
                })
                const bounds=await ctrl.getViewBoundAsync();
                pos={
                    x:Math.round(pos.x+100+bounds.width),
                    y:pos.y
                }

                if(bounds.y+bounds.height>bottom){
                    bottom=bounds.y+bounds.height;
                }

                col++;
                if(col>=cols){
                    pos={
                        x:left,
                        y:bottom+100,
                    }
                    col=0;
                }
            }
        }

        return ctrls;
    }

}
