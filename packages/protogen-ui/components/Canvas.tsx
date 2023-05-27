import { cn } from "@iyio/common";
import { usePanZoomCtrl, useSubject } from "@iyio/react-common";
import { useEffect, useState } from "react";
import NodeView from "./NodeView";
import { useProtogenCtrl } from "./lib-builder-components";

const svgSpan=6000;

interface CanvasProps
{
    editable?:boolean;
}

export default function Canvas({
    editable
}:CanvasProps){

    const ctrl=useProtogenCtrl();
    const entities=useSubject(ctrl.nodes);
    const panZoomCtrl=usePanZoomCtrl();
    useEffect(()=>{
        if(!panZoomCtrl){
            return;
        }
        const sub=panZoomCtrl.state.subscribe(state=>{
            ctrl.pos.next({...state});
        })
        ctrl.pos.next({...panZoomCtrl.state.value});
        return ()=>{
            sub.unsubscribe();
        }
    },[panZoomCtrl,ctrl])

    const [lineGroup,setLineGroup]=useState<SVGGElement|null>(null);
    const [lineGroupMid,setLineGroupMid]=useState<SVGGElement|null>(null);
    const [lineGroupLow,setLineGroupLow]=useState<SVGGElement|null>(null);
    useEffect(()=>{
        ctrl.lineCtrl.lineGroup=lineGroup;
    },[ctrl,lineGroup])
    useEffect(()=>{
        ctrl.lineCtrl.lineGroupMid=lineGroupMid;
    },[ctrl,lineGroupMid])
    useEffect(()=>{
        ctrl.lineCtrl.lineGroupLow=lineGroupLow;
    },[ctrl,lineGroupLow])

    return (
        <div className={cn('Canvas proto-canvas-pos',{editable})}>

            <svg viewBox={`-${svgSpan} -${svgSpan} ${svgSpan*2} ${svgSpan*2}`} width={svgSpan*2} height={svgSpan*2}>
                <g ref={setLineGroupLow}/>
                <g ref={setLineGroupMid}/>
                <g ref={setLineGroup}/>
            </svg>

            {entities.map(e=>(
                <NodeView key={e.id} node={e}/>
            ))}

            <style global jsx>{`
                .Canvas{
                    display:flex;
                    flex-direction:column;
                    flex:1;
                    position:relative;
                }
                .Canvas > svg{
                    position:absolute;
                    left:-${svgSpan}px;
                    top:-${svgSpan}px;
                    height:${svgSpan*2}px;
                    width:${svgSpan*2}px;
                    pointer-events:none;
                    overflow:visible;
                    shape-rendering:optimizespeed;
                }
            `}</style>
        </div>
    )

}
