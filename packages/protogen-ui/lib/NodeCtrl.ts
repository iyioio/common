import { deepClone, DisposeCallback, getSubstringCount, Point, ReadonlySubject, shortUuid } from "@iyio/common";
import { ProtoAddressMap, protoClearRevLinks, protoFlattenHierarchy, protoGetLayout, protoGetPosScale, ProtoLayout, protoMarkdownParseNodes, protoMarkdownRenderer, protoMergeNodes, ProtoNode, ProtoParsingResult, protoParsingResultFromNode, ProtoPosScale, protoRenderLines, protoSetPosScale, protoUpdateLayouts, protoUpdateLinks } from "@iyio/protogen";
import { BehaviorSubject, combineLatest } from "rxjs";
import { dt } from "./lib-design-tokens";
import { getElemProtoLayout } from "./protogen-ui-lib";
import { ProtogenCtrl } from "./ProtogenCtrl";


export class NodeCtrl
{
    public readonly id:string;
    public readonly parent:ProtogenCtrl;
    public autoFocus:boolean=false;
    public autoFocusType:boolean=false;

    private nodeParsingResult:ProtoParsingResult;
    private readonly _node:BehaviorSubject<ProtoNode>;
    public get nodeSubject():ReadonlySubject<ProtoNode>{return this._node}
    public get node(){return this._node.value}

    public readonly code:BehaviorSubject<string>;
    public readonly pos:BehaviorSubject<ProtoPosScale>;
    public readonly viewElem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);
    public readonly codeElem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);

    private readonly _layoutNodes:BehaviorSubject<ProtoLayout[]>=new BehaviorSubject<ProtoLayout[]>([]);
    public get layoutNodesSubject():ReadonlySubject<ProtoLayout[]>{return this._layoutNodes}
    public get layoutNodes(){return this._layoutNodes.value}

    private codeChangeId=0;
    private fullViewNodesParsingResult:ProtoParsingResult|null=null;
    private fullViewNodes:ProtoNode[]|null=null;
    private lastLineCount=0;
    private removeResizeListener?:DisposeCallback;

    public constructor(node:ProtoNode,parent:ProtogenCtrl)
    {
        //this.codeBackup=code;
        this.id=shortUuid();
        this.parent=parent;
        this._node=new BehaviorSubject<ProtoNode>(node);
        this.nodeParsingResult=protoParsingResultFromNode(node);
        this.code=new BehaviorSubject(protoRenderLines(
            {nodes:this.nodeParsingResult.allNodes,renderer:protoMarkdownRenderer}
        ).join('\n'));
        this.pos=new BehaviorSubject<ProtoPosScale>(protoGetPosScale(node));
        combineLatest([this.viewElem,this.pos]).subscribe(([elem,pos])=>{
            if(elem){
                elem.style.transform=`translate(${pos.x}px,${pos.y}px)`;
                elem.style.minWidth=pos.width===undefined?'auto':pos.width+'px';
            }
        })
        this.code.subscribe((code)=>{
            this.codeChangeId++;
            const lineCount=getSubstringCount(code,'\n');
            const lc=this.lastLineCount;
            this.lastLineCount=lineCount;
            this.update(lc!==lineCount?0:700);
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

    private setNode(node:ProtoNode,parsingResult:ProtoParsingResult)
    {
        this.nodeParsingResult=parsingResult;
        this._node.next(node);
    }

    public addToAddressMap(addressMap:ProtoAddressMap){

        for(const node of this.nodeParsingResult.allNodes){
            if(!addressMap[node.address]){
                addressMap[node.address]=node;
            }
        }

        if(this.fullViewNodesParsingResult){
            for(const node of this.fullViewNodesParsingResult.allNodes){
                if(!addressMap[node.address]){
                    addressMap[node.address]=node;
                }
            }
        }
    }

    public readonly setCodeBound=(code:string)=>this.code.next(code);
    public readonly updateBound=()=>this.update();

    _updateViewMode()// todo
    {
        this.codeChangeId++;
        // const fullCode=this.getFullCode(this.lastViewMode);
        // const viewMode=this.parent.viewMode;

        // const code=protoRenderLines(fullCode,viewMode);

        // this.lastViewMode=viewMode;
        // this.codeBackup=fullCode;
        // this.code.next(code);
        // this.update(false);
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

    private readonly getOffset=(layout:ProtoLayout):Point=>{
        return this.pos.value;
    };

    public _updateLayout()
    {

        protoUpdateLayouts(this.nodeParsingResult.allNodes,{
            x:0,
            yStart:dt().codeLineHeight+dt().codeVPadding,
            width:this.viewElem.value?.clientWidth,
            lineHeight:dt().codeLineHeight,
            getOffset:this.getOffset
        })

        const layouts:ProtoLayout[]=[];
        for(const node of this.nodeParsingResult.allNodes){
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

        // todo
        // const layouts:ProtoLayout[]=[];
        // const rootLayout=protoGetLayout(this.node.value);
        // if(rootLayout){
        //     layouts.push(rootLayout);
        // }

        // const children=this.node.value.children??[];
        // for(const child of children){
        //     const layout=protoGetLayout(child);
        //     if(layout){
        //         layouts.push(layout);
        //     }
        // }

        // this.nodeLayouts.next(layouts)
    }

    private lastFullCode:string='';
    private lastFullCodeId=-2;

    public getFullCode():string{
        if(!this.fullViewNodes){
            return this.code.value;
        }
        if(this.codeChangeId===this.lastFullCodeId){
            return this.lastFullCode;
        }
        const dest=protoFlattenHierarchy(deepClone(this.nodeSubject.value,500));
        protoMergeNodes(dest,this.fullViewNodes);
        const fullCode=protoRenderLines({nodes:dest,renderer:protoMarkdownRenderer}).join('\n');
        this.lastFullCodeId=this.codeChangeId;
        this.lastFullCode=fullCode;
        return fullCode;
    }

    public setFullCode(code:string){
        if(this.parent.viewDepth===null){
            this.code.next(code);
        }else{
            this.fullViewNodes=protoMarkdownParseNodes(code).allNodes;
            this.code.next(protoRenderLines(
                {nodes:this.fullViewNodes,maxDepth:this.parent.viewDepth,renderer:protoMarkdownRenderer}
            ).join('\n'));

        }
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

    public addAttribute(childName:string,attName:string,value:string,hidden:boolean){
        // todo
        // const code=addMarkdownAttribute(
        //     this.getFullCode(),
        //     childName,
        //     attName,
        //     value,
        //     hidden
        // )
        // this.setFullCode(code);
    }

}

