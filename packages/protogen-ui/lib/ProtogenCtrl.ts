import { parseProtogenMarkdownItem as parseProtogenMarkdownItems, ProtoPosScale } from "@iyio/protogen";
import { BehaviorSubject } from "rxjs";
import { LineCtrl } from "./LineCtrl";
import { NodeCtrl } from "./NodeCtrl";
import { NodeCtrlAndProp } from "./protogen-ui-lib";

export class ProtogenCtrl
{

    public readonly entities:BehaviorSubject<NodeCtrl[]>;

    public readonly pos:BehaviorSubject<ProtoPosScale>=new BehaviorSubject<ProtoPosScale>({
        x:0,
        y:0,
        scale:1
    });

    public readonly lineCtrl:LineCtrl;

    public constructor(code?:string)
    {
        this.entities=new BehaviorSubject<NodeCtrl[]>([]);

        this.lineCtrl=new LineCtrl(this);

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

        for(const e of this.entities.value){
            e.dispose();
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
            const state:string=this.entities.value.map(e=>e.code.value).join('\n\n');

            await fetch('/api/protogen',{method:'POST',body:JSON.stringify(state)});
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

        const nodes=parseProtogenMarkdownItems(code);

        this.entities.next(nodes.map(e=>(
            new NodeCtrl(e.code,this)
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
