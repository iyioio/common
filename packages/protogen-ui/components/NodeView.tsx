import { useSubject } from "@iyio/react-common";
import { Fragment } from "react";
import { dt } from "../lib/lib-design-tokens";
import { NodeCtrl } from "../lib/NodeCtrl";
import { anchorInset } from "../lib/protogen-ui-lib";
import { NodeCode } from "./NodeCode";


interface NodeViewProps
{
    node:NodeCtrl;
}

export default function NodeView({
    node
}:NodeViewProps){

    const anchors=useSubject(node.nodeLayouts);

    return (
        <div className="NodeView proto-node-pos" ref={e=>node.viewElem.next(e)}>

            <div className="NodeView-drag"><div/></div>

            <div className="NodeView-code">
                <NodeCode node={node} />
            </div>

            {anchors.map((a,i)=>(
                <Fragment key={i}>
                    <button className="NodeView-anchor"  style={{
                        left:(-dt().anchorSize/2)+anchorInset+'px',
                        top:(a.localY-dt().anchorSize/2)+'px'
                    }}>

                    </button>
                    <button className="NodeView-anchor"  style={{
                        right:(-dt().anchorSize/2)+anchorInset+'px',
                        top:(a.localY-dt().anchorSize/2)+'px'
                    }}>

                    </button>
                </Fragment>
            ))}


            <style global jsx>{`
                .NodeView{
                    position:absolute;
                    display:flex;
                    flex-direction:column;
                    background:${dt().entityBgColor};
                    border-radius:${dt().borderRadius};
                }
                .NodeView-drag{
                    height:12px;
                    background:${dt().foreground}07;
                    border-radius:${dt().borderRadius} ${dt().borderRadius} 0 0;
                    cursor:pointer;
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
                    padding:0 6px;
                }
                .NodeView-anchor{
                    position:absolute;
                    background:${dt().anchorColor};
                    border-radius:50%;
                    width:${dt().anchorSize}px;
                    height:${dt().anchorSize}px;
                    border:none;
                    padding:0;
                }
            `}</style>
        </div>
    )

}
