import { getDistanceBetweenPoints, Point } from "@iyio/common";
import { protoGetLayout, ProtoLink } from "@iyio/protogen";
import { dt } from "./lib-design-tokens";
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

    private _lineGroupLow:SVGGElement|null=null;
    public get lineGroupLow(){return this._lineGroupLow}
    public set lineGroupLow(value:SVGGElement|null){
        if(this._lineGroupLow===value){return}
        this._lineGroupLow=value;
        if(value){
            value.innerHTML='';
        }
        this.updateLines();
    }


    public constructor(parent:ProtogenCtrl){
        this.parent=parent;
    }

    private getLine(excludeUpdateId:number,fromAddress:string,toAddress:string){
        for(const line of this.lines){
            if( line.updateId!==excludeUpdateId &&
                line.fromAddress===fromAddress &&
                line.toAddress===toAddress)
            {
                return line;
            }
        }
        return null;
    }


    private lineUpdateId=0;
    private readonly lines:ProtoUiLine[]=[];
    public updateLines(onlyForAddress?:string)
    {
        const group=this._lineGroup;
        const groupLow=this._lineGroupLow;
        if(!group || !groupLow){
            return;
        }
        const updateId=++this.lineUpdateId;

        const addressMap=this.parent.addressMap;

        for(const fromAddress in addressMap){
            const fromNode=addressMap[fromAddress];
            if(!fromNode.links){
                continue;
            }

            for(const link of fromNode.links){

                if(link.rev){
                    continue;
                }

                const toNode=this.parent.getNodeByAddress(link.address);
                if(!toNode){
                    continue;
                }

                const end=protoGetLayout(toNode);
                const start=protoGetLayout(fromNode);
                if(!end || !start){
                    continue;
                }

                let line=this.getLine(updateId,fromAddress,link.address);
                const lineColor=getLinkColor(link);
                const low=link.low??false;

                if(!line){
                    line={
                        fromAddress,
                        toAddress:link.address,
                        updateId,
                        elem:document.createElementNS("http://www.w3.org/2000/svg", "path"),
                        elem2:document.createElementNS("http://www.w3.org/2000/svg", "path"),
                        p1:{x:0,y:0},
                        p2:{x:0,y:0},
                        color:lineColor,
                        link,
                        low,
                    }
                    line.elem.setAttribute('stroke',lineColor);
                    line.elem.setAttribute('fill','none');
                    line.elem.setAttribute('stroke-width','2');
                    line.elem2.setAttribute('stroke',dt().bgColor+'cc');
                    line.elem2.setAttribute('stroke-width','4');
                    line.elem2.setAttribute('fill','none');
                    this.lines.push(line);
                    if(low){
                        groupLow.appendChild(line.elem2);
                        groupLow.appendChild(line.elem);
                    }else{
                        group.appendChild(line.elem2);
                        group.appendChild(line.elem);
                    }
                }

                if(low!==line.low){
                    line.low=low;
                    line.elem.remove();
                    line.elem2.remove();
                    if(low){
                        groupLow.appendChild(line.elem2);
                        groupLow.appendChild(line.elem);
                    }else{
                        group.appendChild(line.elem2);
                        group.appendChild(line.elem);
                    }
                }

                if( onlyForAddress!==undefined &&
                    line.fromAddress!==onlyForAddress &&
                    line.toAddress!==onlyForAddress &&
                    !line.fromAddress.startsWith(onlyForAddress+'.') &&
                    !line.toAddress.startsWith(onlyForAddress+'.')
                ){
                    line.updateId=updateId;
                    continue;
                }

                let dist=Number.MAX_SAFE_INTEGER;

                let dir1:1|-1=1;
                let dir2:1|-1=1;


                const startOffset=start.getOffset?.(start)??{x:0,y:0}
                const endOffset=end.getOffset?.(end)??{x:0,y:0}

                let startPt:Point={x:startOffset.x+start.left,y:startOffset.y+start.y};
                let endPt:Point={x:endOffset.x+end.left,y:endOffset.y+end.y};
                let checkDist=getDistanceBetweenPoints(startPt,endPt);
                if(checkDist<dist){
                    dist=checkDist;
                    line.p1=startPt;
                    line.p2=endPt;
                    dir1=-1;
                    dir2=-1;
                }

                startPt={x:startOffset.x+start.right,y:startOffset.y+start.y};
                endPt={x:endOffset.x+end.left,y:endOffset.y+end.y};
                checkDist=getDistanceBetweenPoints(startPt,endPt);
                if(checkDist<dist){
                    dist=checkDist;
                    line.p1=startPt;
                    line.p2=endPt;
                    dir1=1;
                    dir2=-1;
                }

                startPt={x:startOffset.x+start.left,y:startOffset.y+start.y};
                endPt={x:endOffset.x+end.right,y:endOffset.y+end.y};
                checkDist=getDistanceBetweenPoints(startPt,endPt);
                if(checkDist<dist){
                    dist=checkDist;
                    line.p1=startPt;
                    line.p2=endPt;
                    dir1=-1;
                    dir2=1;
                }

                startPt={x:startOffset.x+start.right,y:startOffset.y+start.y};
                endPt={x:endOffset.x+end.right,y:endOffset.y+end.y};
                checkDist=getDistanceBetweenPoints(startPt,endPt);
                if(checkDist<dist){
                    dist=checkDist;
                    line.p1=startPt;
                    line.p2=endPt;
                    dir1=1;
                    dir2=1;
                }

                line.updateId=updateId;

                const dir=start.node && start.node===end.node?30:Math.min(dist/4,150);
                const d=(
                    `M ${line.p1.x} ${line.p1.y
                    } C ${line.p1.x+(dir*dir1)} ${line.p1.y
                    } ${line.p2.x+(dir*dir2)} ${line.p2.y
                    }  ${line.p2.x} ${line.p2.y}`
                )
                line.elem.setAttribute('d',d);
                line.elem2.setAttribute('d',d);
                if(line.color!==lineColor){
                    line.color=lineColor;
                    line.elem.setAttribute('stroke',lineColor);
                }

            }

        }
        for(let i=0;i<this.lines.length;i++){
            const line=this.lines[i];
            if(line.updateId!==updateId){
                line.elem.remove();
                line.elem2.remove();
                this.lines.splice(i,1);
                i--;
            }
        }
    }
}

const getLinkColor=(link:ProtoLink):string=>{
    if(link.color){
        return link.color;
    }
    if(link.src){
        return '#90550f';
    }
    if(link.low){
        return '#222222';
    }
    return '#88B6BA99';
}
