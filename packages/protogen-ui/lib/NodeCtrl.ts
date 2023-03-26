import { DisposeCallback, Point, shortUuid } from "@iyio/common";
import { addMarkdownAttribute, getMarkdownProtoPos, getProtoLayout, parseMarkdownNodes, ProtoLayout, ProtoNode, ProtoPosScale, setMarkdownProtoPos, splitMarkdownSections } from "@iyio/protogen";
import { BehaviorSubject, combineLatest } from "rxjs";
import { DomViewCharPointer, getElemProtoLayout, getNodesProtoLayout } from "./protogen-ui-lib";
import { ProtogenCtrl } from "./ProtogenCtrl";


export class NodeCtrl
{
    public readonly id:string;
    public readonly parent:ProtogenCtrl;
    public autoFocus:boolean=false;
    public readonly node:BehaviorSubject<ProtoNode>;
    public readonly nodeLayouts:BehaviorSubject<ProtoLayout[]>=new BehaviorSubject<ProtoLayout[]>([]);
    public readonly code:BehaviorSubject<string>;
    public readonly pos:BehaviorSubject<ProtoPosScale>;
    public readonly viewElem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);
    public readonly codeElem:BehaviorSubject<HTMLElement|null>=new BehaviorSubject<HTMLElement|null>(null);

    public constructor(code:string,parent:ProtogenCtrl)
    {
        const nodes=parseMarkdownNodes(code);
        this.id=shortUuid();
        this.parent=parent;
        this.node=new BehaviorSubject<ProtoNode>(nodes[0]??parseMarkdownNodes('## NewType')[0]);
        this.code=new BehaviorSubject(code);
        this.pos=new BehaviorSubject<ProtoPosScale>(getMarkdownProtoPos(code)??{x:0,y:0,scale:1});
        combineLatest([this.viewElem,this.pos]).subscribe(([elem,pos])=>{
            if(elem){
                elem.style.transform=`translate(${pos.x}px,${pos.y}px)`;
                elem.style.minWidth=pos.width===undefined?'auto':pos.width+'px';
            }
        })

    }

    private removeResizeListener?:DisposeCallback;

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose(){
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.removeResizeListener?.();
        this.parent.removeEntity(this);
    }

    public moveTo(point:Point){
        this.pos.next({...this.pos.value,...point});
    }

    public updateCodeLayout(){
        const code=this.getFullCode();
        this.code.next(setMarkdownProtoPos(code,this.pos.value));
    }

    public updateNodeLayouts()
    {
        const layouts:ProtoLayout[]=[];
        const rootLayout=getProtoLayout(this.node.value);
        if(rootLayout){
            layouts.push(rootLayout);
        }

        const children=this.node.value.children??[];
        for(const child of children){
            const layout=getProtoLayout(child);
            if(layout){
                layouts.push(layout);
            }
        }

        this.nodeLayouts.next(layouts)

    }

    public getFullCode(){// todo - flush view changes (get latest code from code input) and parse node and return
        return this.code.value;
    }

    private updateId=0;
    public update(){
        const codeElem=this.codeElem.value;
        if(!codeElem || this._isDisposed){
            return;
        }

        const doUpdate=()=>{

            if(!this.code.value.trim()){
                this.dispose();
                return;
            }

            const pointer=new DomViewCharPointer(codeElem);

            const nodes=parseMarkdownNodes(this.code.value,pointer,views=>{
                return getNodesProtoLayout(
                    views,
                    this.parent.pos.value.scale
                );
            })
            if(!nodes.length){
                this.dispose();
                return;
            }

            this.node.next(nodes[0]);

            if(nodes.length>1){
                const sections=splitMarkdownSections(this.code.value);

                    this.code.next(sections[0]);
                    const nodeLayout=getElemProtoLayout(this.viewElem.value,this.parent.pos.value.scale);
                    for(let i=1;i<sections.length;i++){
                        this.parent.addEntity(
                            setMarkdownProtoPos(
                                sections[i].trim()+'\n',
                                {
                                    x:nodeLayout.left,
                                    y:nodeLayout.bottom+30,
                                    scale:this.parent.pos.value.scale,
                                    width:this.pos.value.width
                                }
                            ),
                            i===sections.length-1
                        );
                    }
            }

            this.updateNodeLayouts();

            this.parent.lineCtrl.updateLines();

        }

        const updateId=++this.updateId;
        if(this.code.value.trim()!==codeElem.innerText.trim()){
            const iv=setInterval(()=>{
                if(this.updateId!==updateId || this._isDisposed){
                    clearInterval(iv);
                    return;
                }
                if(this.code.value.trim()===codeElem.innerText.trim()){
                    clearInterval(iv);
                    doUpdate();
                }
            },15);

        }else{
            doUpdate();
        }

    }

    public addAttribute(childName:string,attName:string,value:string,hidden:boolean){
        const code=addMarkdownAttribute(
            this.getFullCode(),
            childName,
            attName,
            value,
            hidden
        )
        this.code.next(code);
        this.update();
    }
}

