import { markdownHidden } from "@iyio/protogen";
import { DragTarget, PanZoomCtrl, PanZoomView } from "@iyio/react-common";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";
import Canvas from "./Canvas";
import { ProtogenContext } from "./lib-builder-components";
import { ProtogenToolbar } from "./ProtogenToolbar";

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

        const ctrl=new ProtogenCtrl();
        setCtrl(ctrl);

        return ()=>{
            ctrl.dispose();
        }

    },[]);

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
    const onContextMenu=useCallback((e:MouseEvent)=>{

        if(!panZoom || !ctrl || !(e.target as Element).classList?.contains('PanZoomView')){
            return;
        }

        e.preventDefault();

        const pt=panZoom.transformClientPointToPlane({x:e.clientX,y:e.clientY});

        const code=tmpGetCode();//`## NewType`

        ctrl.addEntity(
            code.trim()+
            (code.includes(markdownHidden)?'':'\n\n'+markdownHidden)+
            `\n- $layout: ${Math.round(pt.x)} ${Math.round(pt.y)} 300`
        ,true);


    },[panZoom,ctrl]);

    const dragTargets=useMemo<DragTarget[]>(()=>[{
        className:'NodeView-drag',
        targetParentClass:'NodeView',
        skipSetTransform:true,
        onMove:(pt,elem)=>{
            const entity=ctrl?.getNodeByElem(elem);
            if(entity){
                entity.moveTo(pt);
                entity.update();
            }
        },
        onEnd:(pt,elem)=>{
            const entity=ctrl?.getNodeByElem(elem);
            if(entity){
                entity.moveTo(pt);
                entity.updateCodeLayout();
                entity.update();
            }
        },
    }],[ctrl])

    if(!ctrl){
        return null;
    }

    return (
        <ProtogenContext.Provider value={ctrl}>
            <div className="ProtogenDesignView" onContextMenu={onContextMenu}>

                {enablePanZoom?
                    <PanZoomView
                        getCtrl={setPanZoom}
                        ignoreClasses="NodeView"
                        dragTargets={dragTargets}>

                        <Canvas editable />
                    </PanZoomView>
                :
                    <Canvas editable />
                }

                <ProtogenToolbar ctrl={ctrl}/>


                <style jsx>{`
                    .ProtogenDesignView{
                        display:flex;
                        flex-direction:column;
                        flex:1;
                    }
                `}</style>
            </div>
        </ProtogenContext.Provider>
    )

}

let li=0;
const tmpGetCode=()=>(li++)%2?
`## User
- id: string
- uv: number
- threads: Thread[]
- age: number
`:
`## Thread
  - $link: User
  - $link: User.id
- id: string
- uv: number
- userId: string :User
  - min: 0
  - max: 50
  - index: true
    - order: 5
    - desc
- momId: string :User

*hidden*
- userId:
  - $link: User.threads
    - type: many-one
  - max
    - offset: 77
- uv
  - cake:good
- $self
  - index: 7
  - $link: User.uv
  - $link: user.age
`
