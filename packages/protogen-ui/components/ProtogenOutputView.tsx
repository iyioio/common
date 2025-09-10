import { atDotCss } from "@iyio/at-dot-css";
import { useSubject, View } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { ProtogenCtrl } from "../lib/ProtogenCtrl.js";
import { ProtoButton } from "./ProtoButton.js";

interface ProtogenOutputViewProps
{
    ctrl:ProtogenCtrl;
}

export function ProtogenOutputView({
    ctrl
}:ProtogenOutputViewProps){

    const output=useSubject(ctrl.outputSubject);

    const [outputElem,setOutputElem]=useState<HTMLElement|null>(null);

    useEffect(()=>{
        if(!outputElem){
            return;
        }
        const toBottom=()=>{
            outputElem.scrollTo({
                top:outputElem.scrollHeight,
                behavior:'smooth'
            });
        }
        toBottom();

        const iv1=setTimeout(toBottom,100);
        const iv2=setTimeout(toBottom,500);
        const iv3=setTimeout(toBottom,1500);
        return ()=>{
            clearInterval(iv1);
            clearInterval(iv2);
            clearInterval(iv3);
        }
    },[outputElem,output]);

    const show=useSubject(ctrl.showOutputSubject);

    if(!show){
        return null;
    }

    return (
        <div className={style.root(null,"node-container")}>

            <div ref={setOutputElem} className={style.output()}>{output}</div>

            <View className={style.bottom()} row justifyEnd p1>
                <ProtoButton text="( clear - ctrl+k )" onClick={()=>{ctrl.showOutput=false;ctrl.clearOutput()}}/>
                <ProtoButton text="( close - esc )" onClick={()=>ctrl.showOutput=false}/>
            </View>

        </div>
    )

}

const style=atDotCss({name:'ProtogenOutputView',css:`
    @.root{
        position:absolute;
        top:0;
        left:0;
        right:0;
    }
    @.output{
        white-space:pre;
        overflow:auto;
        overflow:overlay;
        max-height:500px;
        padding:1rem;
        font-size:12px;
        transition:height 0.2s ease-in-out;
    }
    @.bottom{
        position:absolute;
        bottom:-0.75rem;
        right:-0.75rem;
    }

`});
