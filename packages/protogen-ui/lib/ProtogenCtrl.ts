import { ReadonlySubject } from "@iyio/common";
import { ProtoLayout, ProtoPosScale, ProtoViewMode, splitMarkdown } from "@iyio/protogen";
import { BehaviorSubject } from "rxjs";
import { LineCtrl } from "./LineCtrl";
import { NodeCtrl } from "./NodeCtrl";
import { NodeCtrlAndProp, ProtoAnchor, SaveRequest } from "./protogen-ui-lib";

export class ProtogenCtrl
{

    public readonly entities:BehaviorSubject<NodeCtrl[]>;

    public readonly pos:BehaviorSubject<ProtoPosScale>=new BehaviorSubject<ProtoPosScale>({
        x:0,
        y:0,
        scale:1
    });

    public readonly lineCtrl:LineCtrl;

    private readonly _activeAnchor:BehaviorSubject<ProtoAnchor|null>=new BehaviorSubject<ProtoAnchor|null>(null);
    public get activeAnchorSubject():ReadonlySubject<ProtoAnchor|null>{return this._activeAnchor}
    public get activeAnchor(){return this._activeAnchor.value}

    private readonly _viewMode:BehaviorSubject<ProtoViewMode>=new BehaviorSubject<ProtoViewMode>('all');
    public get viewModeSubject():ReadonlySubject<ProtoViewMode>{return this._viewMode}
    public get viewMode(){return this._viewMode.value}
    public set viewMode(value:ProtoViewMode){
        if(value==this._viewMode.value){
            return;
        }
        this._viewMode.next(value);
        this.updateViewMode();

    }

    public constructor(code?:string)
    {
        this.entities=new BehaviorSubject<NodeCtrl[]>([]);

        this.lineCtrl=new LineCtrl(this);

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

        window.removeEventListener('mouseup',this.mouseUpListener);

        for(const e of this.entities.value){
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
        for(const n of this.entities.value){
            n._updateViewMode()
        }
        this.lineCtrl.updateLines();
    }

    public selectAnchor(layout:ProtoLayout,side:'left'|'right',ctrl:NodeCtrl)
    {
        console.log({layout})
        const a=this._activeAnchor.value;
        if(a){
            this._activeAnchor.next(null);
            if((a.layout!==layout || a.side!==side) && layout.node && a.layout.node){
                a.ctrl.addAttribute(
                    a.layout.node.name===a.ctrl.node.value.name?'$self':a.layout.node.name,
                    '$link',
                    `${
                        ctrl.node.value.name
                    }${
                        layout.node.name===ctrl.node.value.name?'':'.'+layout.node.name
                    }`,
                    true
                )
            }
        }else{
            this._activeAnchor.next({layout,side,ctrl,time:Date.now()});
        }
    }

    public getNodeByElem(elem:HTMLElement){
        for(const n of this.entities.value){
            if(n.viewElem.value===elem){
                return n;
            }
        }
        return null;
    }

    public addEntity(code:string,autoFocus?:boolean):NodeCtrl
    {
        const ctrl=new NodeCtrl(code,this);
        if(autoFocus){
            ctrl.autoFocus=true;
        }
        this.entities.next([...this.entities.value,ctrl]);
        return ctrl;
    }

    public removeEntity(entity:NodeCtrl)
    {
        if(this.entities.value.includes(entity)){
            this.entities.next(this.entities.value.filter(e=>e!==entity));
        }
    }

    private exporting=false;
    public async exportAsync()
    {
        if(this.exporting || this._isDisposed){
            return;
        }
        this.exporting=true;

        try{
            const content:string=this.entities.value.map(e=>e.getFullCode()).join('\n\n');

            const request:SaveRequest={
                content
            }

            await fetch('/api/protogen',{method:'POST',body:JSON.stringify(request)});
        }finally{
            this.exporting=false;
        }
    }

    public clearState()
    {
        this.entities.next([]);
    }

    private setStateIndex=0;

    public setState(code:string)
    {
        this.setStateIndex++;

        const nodes=splitMarkdown(code);

        this.entities.next(nodes.map(e=>(
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


    public getMatch(nodeName:string,propName?:string):NodeCtrlAndProp|null{
        for(const node of this.entities.value){
            if(node.node.value.name!==nodeName){
                continue;
            }
            if(!propName){
                return {node}
            }
            for(const a of node.nodeLayouts.value){
                if(a.node?.name===propName){
                    return {
                        node,
                        prop:a
                    }
                }
            }
        }
        return null;
    }


}
