import { delayAsync, ReadonlySubject, uuid } from "@iyio/common";
import { ProtoAddressMap, protoGetNodeAtPath, ProtoLayout, protoMarkdownParseNodes, ProtoNode, ProtoPosScale } from "@iyio/protogen";
import { BehaviorSubject } from "rxjs";
import { LineCtrl } from "./LineCtrl";
import { NodeCtrl } from "./NodeCtrl";
import { ProtoAnchor, SaveRequest } from "./protogen-ui-lib";
import { ProtoKeyListener } from "./ProtoKeyListener";

export class ProtogenCtrl
{

    public readonly lineCtrl:LineCtrl;
    public readonly keyListener:ProtoKeyListener;

    public readonly nodes:BehaviorSubject<NodeCtrl[]>;

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

    private readonly _apiOutput:BehaviorSubject<string>=new BehaviorSubject<string>('');
    public get apiOutputSubject():ReadonlySubject<string>{return this._apiOutput}
    public get apiOutput(){return this._apiOutput.value}

    public constructor(code?:string)
    {
        this.nodes=new BehaviorSubject<NodeCtrl[]>([]);

        this.lineCtrl=new LineCtrl(this);
        this.keyListener=new ProtoKeyListener(this);

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
            const end=i===nodes.length-1;
            const ctrl=new NodeCtrl(nodes[i],this);
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

    public clearApiOutput(){
        this._apiOutput.next('');
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
                            this._apiOutput.next(this._apiOutput.value+out);
                        }
                        if(complete){
                            _continue--;
                        }
                    }catch{/* */}
                }
            })();


            await fetch('/api/protogen',{method:'POST',body:JSON.stringify(request)});
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

}
