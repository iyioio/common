import { DragTarget, PanZoomCtrl, PanZoomView } from "@iyio/react-common";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";
import Canvas from "./Canvas";
import { ProtogenOutputView } from "./ProtogenOutputView";
import { ProtogenToolbar } from "./ProtogenToolbar";
import { ProtogenContext } from "./lib-builder-components";

interface ProtogenViewProps
{
    enablePanZoom?:boolean;
    code?:string
    url?:string;
}

export default function ProtogenView({
    enablePanZoom,
    code,
    url,
}:ProtogenViewProps){

    const [ctrl,setCtrl]=useState<ProtogenCtrl|null>(null);

    useEffect(()=>{

        const ctrl=new ProtogenCtrl(undefined,url);
        setCtrl(ctrl);

        return ()=>{
            ctrl.dispose();
        }

    },[url]);

    useEffect(()=>{
        if(!ctrl){
            return;
        }
        if(url){
            ctrl.loadStateAsync(url);
        }else if(code){
            ctrl.setState(code);
        }else{
            ctrl.clearState();
        }
    },[code,url,ctrl])

    const [panZoom,setPanZoom]=useState<PanZoomCtrl|null>(null);

    useEffect(()=>{
        if(ctrl){
            ctrl.panZoom=panZoom;
        }
    },[panZoom,ctrl]);

    const onContextMenu=useCallback((e:MouseEvent)=>{

        if(!panZoom || !ctrl || !(e.target as Element).classList?.contains('PanZoomView')){
            return;
        }

        e.preventDefault();

        const pt=panZoom.transformClientPointToPlane({x:e.clientX,y:e.clientY});

        const code=defaultType();

        ctrl.addNodes(
            code.trim()+
            `\n- $layout: ${Math.round(pt.x)} ${Math.round(pt.y)} 300`
        ,'type');


    },[panZoom,ctrl]);

    const dragTargets=useMemo<DragTarget[]>(()=>[{
        className:'NodeView-drag',
        targetParentClass:'NodeView',
        skipSetTransform:true,
        onMove:(pt,elem)=>{
            const entity=ctrl?.getNodeByElem(elem);
            if(entity){
                entity.moveTo(pt);
            }
        },
        onEnd:(pt,elem)=>{
            const entity=ctrl?.getNodeByElem(elem);
            if(entity){
                entity.updateCodeLayout(pt);
            }
        },
    }],[ctrl])

    if(!ctrl){
        return null;
    }

    return (
        <ProtogenContext.Provider value={ctrl}>
            <div className="ProtogenView" onContextMenu={onContextMenu}>

                {enablePanZoom?
                    <PanZoomView
                        mode="editor"
                        getCtrl={setPanZoom}
                        ignoreClasses="NodeView"
                        dragTargets={dragTargets}>

                        <Canvas editable />
                    </PanZoomView>
                :
                    <Canvas editable />
                }

                <ProtogenToolbar ctrl={ctrl}/>

                <ProtogenOutputView ctrl={ctrl}/>


                <style jsx>{`
                    .ProtogenView{
                        display:flex;
                        flex-direction:column;
                        flex:1;
                        position:relative;
                        overflow:hidden;
                        overflow:clip;
                    }
                `}</style>
            </div>
        </ProtogenContext.Provider>
    )

}

let newTypeIndex=1;
const defaultType=()=>(
`## NewType${newTypeIndex++}
`)
