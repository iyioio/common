import { atDotCss } from "@iyio/at-dot-css";
import { delayAsync } from "@iyio/common";
import { useSubject, View } from "@iyio/react-common";
import { useCallback, useState } from "react";
import { dt } from "../lib/lib-design-tokens";
import { UiState } from "../lib/protogen-ui-lib";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";
import { CommandInput } from "./CommandInput";
import { ProtoButton } from "./ProtoButton";

const depths=[0,1,2,3]

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
            console.error(ex);
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
            console.error(ex);
            setExecuteState('danger')
        }
        await delayAsync(1000);
        setExecuteState(undefined);
    },[ctrl,executeState]);

    return (
        <div className={style.root(null,"node-container")}>
            <View flex1 row>
                <CommandInput ctrl={ctrl}/>
            </View>
            <View g1>
                <ProtoButton active={mode===null} text="-" onClick={()=>ctrl.viewDepth=null}/>
                {depths.map(d=>(
                    <ProtoButton key={d} success={mode===d} text={d.toString()} onClick={()=>ctrl.viewDepth=ctrl.viewDepth===d?null:d}/>
                ))}
            </View>
            <View row justifyEnd g1>
                <ProtoButton state={executeState} text="execute" onClick={execute}/>
                <ProtoButton state={saveState} text="save" onClick={save}/>
            </View>


            <View row justifyCenter alignCenter  g1 className={style.message()}>
                {activeAnchor?
                    '( Select a connecting point )'
                :mode===null?
                    ''
                :
                    `( View depth = ${mode}, View only )`
                }
            </View>

        </div>
    )

}


const style=atDotCss({name:'ProtogenToolbar',css:`
    @.root{
        position:absolute;
        left:0;
        right:0;
        bottom:0;
        display:flex;
        padding:4px ${dt().containerPadding};
        gap:1rem;
    }
    @.message{
        position:absolute;
        right:1rem;
        top:-1.5rem;
        opacity:0.2;
        font-size:12px;
        pointer-events:none;
    }
`});
