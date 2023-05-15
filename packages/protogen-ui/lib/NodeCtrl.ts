import { aiComplete } from "@iyio/ai-complete";
import { DisposeCallback, getSubstringCount, Point, ReadonlySubject, shortUuid } from "@iyio/common";
import { protoAddChild, ProtoAddressMap, protoClearRevLinks, protoGetLayout, protoGetPosScale, ProtoLayout, protoMarkdownGetIndent, protoMarkdownParseNodes, protoMarkdownRenderer, ProtoNode, ProtoParsingResult, protoParsingResultFromNode, ProtoPosScale, protoRenderLines, protoSetNodeCtrl, protoSetPosScale, protoUpdateLayouts, protoUpdateLinks } from "@iyio/protogen";
import { BehaviorSubject, combineLatest } from "rxjs";
import { dt } from "./lib-design-tokens";
import { getElemProtoLayout } from "./protogen-ui-lib";
import { ProtogenCtrl } from "./ProtogenCtrl";

const completeReg=/\?\?(([^?]|\n)+)\?\?/g;
const completeTestReg=/\?\?(([^?]|\n)+)\?\?/;

export class NodeCtrl
{
    public readonly id:string;
    public readonly parent:ProtogenCtrl;
    public autoFocus:boolean=false;
    public autoFocusType:boolean=false;

    private viewOnlyNodeParsingResult:ProtoParsingResult|null=null
    private nodeParsingResult:ProtoParsingResult;
    private readonly _node:BehaviorSubject<ProtoNode>;
    public get nodeSubject():ReadonlySubject<ProtoNode>{return this._node}
    public get node(){return this._node.value}

    public readonly code:BehaviorSubject<string>;
    public readonly pos:BehaviorSubject<ProtoPosScale>;
    public readonly viewElem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);
    public readonly codeElem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);

    private readonly _viewOnlyCode:BehaviorSubject<string|null>=new BehaviorSubject<string|null>(null);
    public get viewOnlyCodeSubject():ReadonlySubject<string|null>{return this._viewOnlyCode}
    public get viewOnlyCode(){return this._viewOnlyCode.value}

    private readonly _layoutNodes:BehaviorSubject<ProtoLayout[]>=new BehaviorSubject<ProtoLayout[]>([]);
    public get layoutNodesSubject():ReadonlySubject<ProtoLayout[]>{return this._layoutNodes}
    public get layoutNodes(){return this._layoutNodes.value}

    private readonly _completing:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get completingSubject():ReadonlySubject<boolean>{return this._completing}
    public get completing(){return this._completing.value}

    private lastLineCount=0;
    private removeResizeListener?:DisposeCallback;

    public constructor(node:ProtoNode,parent:ProtogenCtrl)
    {
        this.id=shortUuid();
        this.parent=parent;
        this._node=new BehaviorSubject<ProtoNode>(node);
        this.nodeParsingResult=protoParsingResultFromNode(node);
        this.code=new BehaviorSubject(protoRenderLines(
            {nodes:this.nodeParsingResult.allNodes,renderer:protoMarkdownRenderer}
        ).join('\n').trimEnd());
        this.pos=new BehaviorSubject<ProtoPosScale>(protoGetPosScale(node));
        combineLatest([this.viewElem,this.pos]).subscribe(([elem,pos])=>{
            if(elem){
                elem.style.transform=`translate(${pos.x}px,${pos.y}px)`;
                elem.style.minWidth=pos.width===undefined?'auto':pos.width+'px';
            }
        })
        this.code.subscribe((code)=>{
            const lineCount=getSubstringCount(code,'\n');
            const lc=this.lastLineCount;
            this.lastLineCount=lineCount;
            if(this.viewOnlyNodeParsingResult){
                this._updateViewMode();
            }
            this.update(lc!==lineCount?0:700);

            if(completeTestReg.test(code)){
                this.completeAsync(code);
            }
        })
        this.codeElem.subscribe(this.updateBound);

        this.viewElem.subscribe(view=>{
            this.removeResizeListener?.();
            if(!view){
                return;
            }
            let width=-1;
            let height=-1;
            const ob=new ResizeObserver((e)=>{
                const w=Math.round(e[0]?.contentRect.width??0);
                const h=Math.round(e[0]?.contentRect.height??0);
                if(width===w && height===h){
                    return;
                }
                width=w;
                height=h;
                this.updateLayout(15);
            })

            ob.observe(view);

            this.removeResizeListener=()=>ob.disconnect();
        })

        this.nodeSubject.subscribe(()=>{
            this.parent.clearAddressMap();
        })

    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose(){
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.removeResizeListener?.();
        this.parent.removeNode(this);
    }

    private async completeAsync(code:string){
        if(this._completing.value){
            return;
        }
        const matches=[...code.matchAll(completeReg)].map(s=>s[1]);

        if(!matches.length){
            return;
        }

        this._completing.next(true);
        try{

            const results=await Promise.all(matches.map(v=>aiComplete().completeAsync({
                prompt:[
                    {
                        role:'system',
                        content:
`You are an expert programer writing documentation for an application in a language based on markdown.
The documentation defines each part of the application using a markdown header using 2 hash symbols ( ## ) followed by properties specific to that part of the application.
The header first defines the name of the application part starting with an uppercase letter.
Following the name of the part of the application is the type of the application part.
Application part types are as follows:
- struct - A data structure
- table - A database table
- action - A workflow action
- workerGroup - A group of users
- serverFn - A server function
- function - A javascript function

The current documentation is as follows:
${this.parent.nodes.value.map((e,i)=>e===this || i>20?'':e.getFullCode()).join('\n\n')}`,
                    },
                    {
                        role:'user',
                        content:v
                    }
                ]
            })));

            let i=0;
            //const newCode=results[i++]?.options?.[0]?.message?.content??'_';
            this._parse(code.replace(completeReg,(a)=>results[i++]?.options?.[0]?.message?.content??'_').replace('??',''));
            //this.dispose();

        }finally{
            this._completing.next(false);
        }
    }

    private setNode(node:ProtoNode,parsingResult:ProtoParsingResult)
    {
        this.nodeParsingResult=parsingResult;
        for(const node of parsingResult.rootNodes){
            protoSetNodeCtrl(node,this);
        }
        this._node.next(node);
    }

    public addToAddressMap(addressMap:ProtoAddressMap){

        for(const node of this.nodeParsingResult.allNodes){
            if(!addressMap[node.address]){
                addressMap[node.address]=node;
            }
        }
    }

    public readonly setCodeBound=(code:string)=>this.code.next(code);
    public readonly updateBound=()=>this.update();

    _updateViewMode(delay=0)
    {
        if(this.parent.viewDepth===null){
            this.viewOnlyNodeParsingResult=null;
            this._viewOnlyCode.next(null);
            return;
        }

        const code=protoRenderLines({
            nodes:this.nodeParsingResult.allNodes,
            maxDepth:this.parent.viewDepth??0,
            hideContent:true,
            hideSpecial:true,
        }).join('\n')

        this.viewOnlyNodeParsingResult=protoMarkdownParseNodes(code);
        this._viewOnlyCode.next(code);

        this.updateLayout(delay);
    }

    private _moveTo(point:Point){
        this.pos.next({...this.pos.value,...point});
    }

    public moveTo(point:Point){
        this._moveTo(point);
        this.parent.lineCtrl.updateLines(this._node.value.address);
    }

    public updateCodeLayout(point?:Point){
        if(point){
            this._moveTo(point);
        }
        protoSetPosScale(this.nodeSubject.value,{...this.pos.value,...point});
        this.pushNodeToCode();
    }

    public getNodeByAddress(address:string):ProtoNode|null{
        return this.nodeParsingResult.addressMap[address]??null;
    }

    public clearRevLinks()
    {
        protoClearRevLinks(this.nodeParsingResult.allNodes);
    }

    public updateLinks(addressMap:ProtoAddressMap=this.parent.addressMap)
    {
        protoUpdateLinks(this.nodeParsingResult.allNodes,addressMap);
    }

    private readonly getOffset=(layout:ProtoLayout):Point=>{
        return this.pos.value;
    };

    private lastLayoutUpdateId=0;
    public updateLayout(delay:number=0)
    {
        const id=++this.lastLayoutUpdateId;
        if(delay<=0){
            this._updateLayout();
        }else{
            setTimeout(()=>{
                if(!this._isDisposed && id===this.lastLayoutUpdateId){
                    this._updateLayout();
                }
            },delay)
        }

    }

    private _updateLayout()
    {

        const nodes=this.nodeParsingResult.allNodes;
        const viewOnly=this.viewOnlyNodeParsingResult;

        if(viewOnly){
            protoUpdateLayouts(viewOnly.allNodes,{
                x:0,
                yStart:dt().codeLineHeight+dt().codeVPadding,
                width:this.viewElem.value?.clientWidth,
                lineHeight:dt().codeLineHeight,
                getOffset:this.getOffset
            })
        }

        protoUpdateLayouts(nodes,{
            x:0,
            yStart:dt().codeLineHeight+dt().codeVPadding,
            width:this.viewElem.value?.clientWidth,
            lineHeight:dt().codeLineHeight,
            getOffset:this.getOffset,
            transform:viewOnly?(node,layout)=>(viewOnly.addressMap[node.address]?
                (protoGetLayout(viewOnly.addressMap[node.address])??layout):
                {
                    ...layout,
                    y:(
                        dt().codeLineHeight*(viewOnly.allNodes.length)+
                        dt().codeLineHeight/2+
                        dt().codeVPadding
                    ),
                    disabled:true
                }
            ):undefined
        })



        const layouts:ProtoLayout[]=[];
        for(const node of nodes){
            if(node.isContent || node.special){
                continue;
            }
            const layout=protoGetLayout(node);
            if(!layout){
                continue;
            }
            layouts.push(layout);
        }

        this._layoutNodes.next(layouts);

        this.parent.lineCtrl.updateLines(this._node.value.address);
    }

    public getFullCode():string{
        return this.code.value;
    }

    public setFullCode(code:string){
        this.code.next(code);
    }

    private updateId=0;
    public update(delay=0){
        const codeElem=this.codeElem.value;
        if(!codeElem || this._isDisposed){
            return;
        }

        const updateId=++this.updateId;
        if(delay>0 || this.code.value.trim()!==codeElem.innerText.trim()){
            const iv=setInterval(()=>{
                if(this.updateId!==updateId || this._isDisposed){
                    clearInterval(iv);
                    return;
                }
                if(this.code.value.trim()===codeElem.innerText.trim()){
                    clearInterval(iv);
                    this.doUpdate();
                }
            },delay>0?delay:15);

        }else{
            this.doUpdate();
        }

    }

    private doUpdate(){

        const code=this.code.value;

        if(!code.trim()){
            setTimeout(()=>{
                if(!this._isDisposed && !this.code.value.trim()){
                    this.dispose();
                }
            },1500)
            return;
        }

        this._parse(code);

    }

    private _parse(code:string){

        const parsingResult=protoMarkdownParseNodes(code);
        const nodes=parsingResult.rootNodes;
        if(!nodes.length){
            this.dispose();
            return;
        }

        this.setNode(nodes[0],parsingResult);

        if(nodes.length>1){
            const nodeLayout=getElemProtoLayout(this.viewElem.value,this.parent.pos.value.scale);
            for(let i=1;i<nodes.length;i++){
                const newNode=nodes[i];
                protoSetPosScale(newNode,{
                    x:nodeLayout.left,
                    y:nodeLayout.bottom+30,
                    scale:this.parent.pos.value.scale,
                    width:this.pos.value.width
                })
                this.parent.addNode(newNode,i===nodes.length-1);
            }

            this.pushNodeToCode();

        }

        this.updateLayout();

    }

    private pushNodeToCode()
    {
        this.code.next(protoRenderLines(
            {rootNode:this._node.value,renderer:protoMarkdownRenderer}
        ).join('\n'))
    }
    public addCodeAfterAddress(address:string,code:string,autoIndent?:boolean){
        const index=this.nodeParsingResult.allNodes.findIndex(n=>n.address===address);
        if(index===-1){
            return false;
        }

        const lines=this.nodeParsingResult.allNodes.map(n=>(
            n.renderData?.input??(protoMarkdownRenderer(n,n.renderData??{})).input)??''
        );

        if(autoIndent!==undefined){
            const before=lines[index];
            code=protoMarkdownGetIndent(before)+(/^\s*#/.test(before)?'':'  ')+code;
        }

        lines.splice(index+1,0,code);
        const r=protoMarkdownParseNodes(lines.join('\n'));
        this.setNode(r.rootNodes[0],r);
        this.pushNodeToCode();
    }

    public addChildToAddress(address:string,child:ProtoNode){
        const node=this.nodeParsingResult.addressMap[address];
        if(!node){
            return false;
        }
        protoAddChild(node,child);
        this.pushNodeToCode();
        return true;
    }

}

