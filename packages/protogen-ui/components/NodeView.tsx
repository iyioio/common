import { cn } from "@iyio/common";
import { useSubject } from "@iyio/react-common";
import { Fragment, useEffect, useState } from "react";
import { NodeCtrl } from "../lib/NodeCtrl";
import { dt } from "../lib/lib-design-tokens";
import { anchorInset } from "../lib/protogen-ui-lib";
import { NodeCode } from "./NodeCode";
import { useProtogenCtrl } from "./lib-builder-components";


interface NodeViewProps
{
    node:NodeCtrl;
}

export default function NodeView({
    node
}:NodeViewProps){

    const ctrl=useProtogenCtrl();
    const anchors=useSubject(node.layoutNodesSubject);
    const activeAnchor=useSubject(ctrl.activeAnchorSubject);
    const completing=useSubject(node.completingSubject);
    const [view,setView]=useState<HTMLElement|null>(null);
    useEffect(()=>{
        node.viewElem.next(view);
    },[node,view])

    return (
        <div className={cn("NodeView proto-node-pos node-container",{completing})} ref={setView}>

            <div className="NodeView-drag"><div/></div>

            <div className="NodeView-code">
                <NodeCode node={node} />
            </div>

            {anchors.map((a,i)=>(
                <Fragment key={i}>
                    <button
                        onClick={()=>{ctrl.selectAnchor(a,'left',node)}}
                        disabled={a.disabled}
                        className={cn("NodeView-anchor left",{
                            active:activeAnchor?.layout===a && activeAnchor.side==='left',
                            disabled:a.disabled,
                            broken:a.broken,
                        })}
                        style={{
                            left:(-dt().anchorSize/2)+anchorInset+'px',
                            top:(a.y-dt().anchorSize/2)+'px'
                        }}
                    />

                    <button
                        onClick={()=>{ctrl.selectAnchor(a,'right',node)}}
                        disabled={a.disabled}
                        className={cn("NodeView-anchor right",{
                            active:activeAnchor?.layout===a && activeAnchor.side==='right',
                            disabled:a.disabled,
                            broken:a.broken,
                        })}
                        style={{
                            right:(-dt().anchorSize/2)+anchorInset+'px',
                            top:(a.y-dt().anchorSize/2)+'px'
                        }}
                    />
                </Fragment>
            ))}


            <style global jsx>{`
                .NodeView{
                    position:absolute;
                    display:flex;
                    flex-direction:column;
                    border-radius:${dt().borderRadius};
                    transition:opacity 0.3s ease-in-out;
                }
                .NodeView.completing{
                    opacity:0.5;
                }
                .NodeView-drag{
                    height:${dt().codeLineHeight}px;
                    background:${dt().foreground}07;
                    border-radius:${dt().borderRadius} ${dt().borderRadius} 0 0;
                    cursor:move;
                    position:relative;
                }
                .NodeView-drag>div{
                    position:absolute;
                    left:-4px;
                    right:-4px;
                    top:-4px;
                    bottom:-4px;
                }
                .NodeView-code{
                    padding:${dt().codeVPadding}px ${dt().codeHPadding}px;
                }
                .NodeView-anchor{
                    position:absolute;
                    background:${dt().anchorColor};
                    border-radius:50%;
                    width:${dt().anchorSize}px;
                    height:${dt().anchorSize}px;
                    border:none;
                    padding:0;
                    transition:background-color 0.2s ease-in-out;
                    z-index:1;
                }
                .NodeView-anchor.left{
                    cursor:w-resize;
                }
                .NodeView-anchor.right{
                    cursor:e-resize;
                }
                .NodeView-anchor:hover{
                    background:${dt().lineColor}cc;
                }
                .NodeView-anchor.active{
                    background:${dt().lineColor};
                }
                .NodeView-anchor.disabled{
                    z-index:0;
                }
                .NodeView-anchor.broken{
                    background:${dt().dangerColor};
                    z-index:2;
                }
            `}</style>
        </div>
    )

}
