import { delayAsync } from "@iyio/common";
import { useSubject, View } from "@iyio/react-common";
import { useCallback, useState } from "react";
import { dt } from "../lib/lib-design-tokens";
import { UiState } from "../lib/protogen-ui-lib";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";
import { ProtoButton } from "./ProtoButton";

interface ProtogenToolbarProps
{
    ctrl:ProtogenCtrl;
}

export function ProtogenToolbar({
    ctrl
}:ProtogenToolbarProps){

    const activeAnchor=useSubject(ctrl.activeAnchorSubject);
    const mode=useSubject(ctrl.viewDepthSubject);

    const [saveState,setSaveState]=useState<UiState|undefined>();
    const [executeState,setExecuteState]=useState<UiState|undefined>();

    const save=useCallback(async ()=>{
        if(saveState){
            return;
        }
        setSaveState('info');
        try{
            await ctrl.saveAsync();
            setSaveState('success');
            await delayAsync(300);
        }catch(ex){
            console.log(ex);
            setSaveState('danger')
        }
        await delayAsync(1000);
        setSaveState(undefined);
    },[ctrl,saveState]);

    const execute=useCallback(async ()=>{
        if(executeState){
            return;
        }
        setExecuteState('info');
        try{
            await ctrl.saveAsync({executePipeline:true});
            setExecuteState('success');
            await delayAsync(300);
        }catch(ex){
            console.log(ex);
            setExecuteState('danger')
        }
        await delayAsync(1000);
        setExecuteState(undefined);
    },[ctrl,executeState]);

    return (
        <div className="ProtogenToolbar node-container">
            <View flex1 g1>
                <ProtoButton active={mode===0} text="0" onClick={()=>ctrl.viewDepth=ctrl.viewDepth===0?null:0}/>
                <ProtoButton active={mode===1} text="1" onClick={()=>ctrl.viewDepth=ctrl.viewDepth===1?null:1}/>
                <ProtoButton active={mode===2} text="2" onClick={()=>ctrl.viewDepth=ctrl.viewDepth===2?null:2}/>
            </View>
            <View row justifyCenter alignCenter flex1 g1 className="ProtogenToolbar-message">
                {activeAnchor?'( Select a connecting point )':''}
            </View>
            <View row flex1 justifyEnd g1>
                <ProtoButton state={executeState} text="execute" onClick={execute}/>
                <ProtoButton state={saveState} text="save" onClick={save}/>
            </View>


            <style global jsx>{`
                .ProtogenToolbar{
                    position:absolute;
                    left:0;
                    right:0;
                    bottom:0;
                    display:flex;
                    padding:4px ${dt().containerPadding};
                }
                .ProtogenToolbar-message{
                    opacity:0.5;
                    font-size:12px;
                }
            `}</style>
        </div>
    )

}
