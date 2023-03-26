import { getDistanceBetweenPoints } from "@iyio/common";
import { getProtoLayout } from "@iyio/protogen";
import { ProtoUiLine } from "./protogen-ui-lib";
import { ProtogenCtrl } from "./ProtogenCtrl";

export class LineCtrl
{

    private readonly parent:ProtogenCtrl;

    private _lineGroup:SVGGElement|null=null;
    public get lineGroup(){return this._lineGroup}
    public set lineGroup(value:SVGGElement|null){
        if(this._lineGroup===value){return}
        this._lineGroup=value;
        if(value){
            value.innerHTML='';
        }
        this.updateLines();
    }


    public constructor(parent:ProtogenCtrl){
        this.parent=parent;
    }

    private getLine(ctrlId:string, nodeName:string,propName?:string){
        for(const line of this.lines){
            if(line.nodeCtrlId===ctrlId && line.nodeName===nodeName && line.propName===propName){
                return line;
            }
        }
        return null;
    }


    private lineUpdateId=0;
    private readonly lines:ProtoUiLine[]=[];
    public updateLines()
    {
        const group=this._lineGroup;
        if(!group){
            return;
        }
        const updateId=++this.lineUpdateId;

        for(const node of this.parent.entities.value){
            for(const anchor of node.nodeLayouts.value){

                const links=anchor.node?.links;
                if(!links){
                    continue;
                }

                for(const link of links){

                    const match=this.parent.getMatch(link.nodeName,link.propName);
                    if(!match){
                        continue;
                    }

                    const end=link.propName?match.prop:getProtoLayout(match.node.node.value);
                    if(!end){
                        continue;
                    }

                    const nodeName=match.node.node.value.name;
                    const propName=match.prop?.node?.name;
                    let line=this.getLine(node.id,nodeName,propName);

                    if(!line){
                        line={
                            nodeCtrlId:node.id,
                            updateId,
                            elem:document.createElementNS("http://www.w3.org/2000/svg", "line"),
                            nodeName,
                            propName,
                            p1:{x:0,y:0},
                            p2:{x:0,y:0},
                        }
                        line.elem.setAttribute('stroke','#88B6BA');
                        this.lines.push(line);
                        group.appendChild(line.elem);
                    }

                    let dist=Number.MAX_SAFE_INTEGER;

                    let checkDist=getDistanceBetweenPoints(anchor.lPt,end.lPt);
                    if(checkDist<dist){
                        dist=checkDist;
                        line.p1=anchor.lPt;
                        line.p2=end.lPt;
                    }
                    checkDist=getDistanceBetweenPoints(anchor.rPt,end.lPt);
                    if(checkDist<dist){
                        dist=checkDist;
                        line.p1=anchor.rPt;
                        line.p2=end.lPt;
                    }
                    checkDist=getDistanceBetweenPoints(anchor.lPt,end.rPt);
                    if(checkDist<dist){
                        dist=checkDist;
                        line.p1=anchor.lPt;
                        line.p2=end.rPt;
                    }
                    checkDist=getDistanceBetweenPoints(anchor.rPt,end.rPt);
                    if(checkDist<dist){
                        dist=checkDist;
                        line.p1=anchor.rPt;
                        line.p2=end.rPt;
                    }

                    line.updateId=updateId;
                    line.elem.setAttribute('x1',line.p1.x.toString());
                    line.elem.setAttribute('y1',line.p1.y.toString());
                    line.elem.setAttribute('x2',line.p2.x.toString());
                    line.elem.setAttribute('y2',line.p2.y.toString());

                }
            }
        }
        for(let i=0;i<this.lines.length;i++){
            const line=this.lines[i];
            if(line.updateId!==updateId){
                line.elem.remove();
                this.lines.splice(i,1);
                i--;
            }
        }
    }
}
