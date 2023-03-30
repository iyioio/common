import { useSubject, View } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";

interface ProtogenOutputViewProps
{
    ctrl:ProtogenCtrl;
}

export function ProtogenOutputView({
    ctrl
}:ProtogenOutputViewProps){

    const output=useSubject(ctrl.apiOutputSubject);

    const [outputElem,setOutputElem]=useState<HTMLElement|null>(null);

    useEffect(()=>{
        if(outputElem){
            const toBottom=()=>{
                outputElem.scrollTo({
                    top:outputElem.scrollHeight,
                    behavior:'smooth'
                });
            }
            toBottom();

            setTimeout(toBottom,100);
            setTimeout(toBottom,500);
            setTimeout(toBottom,1500);
        }
    },[outputElem,output])

    if(!output){
        return null;
    }

    return (
        <div className="ProtogenOutputView node-container">

            <div ref={setOutputElem} className="ProtogenOutputView-output">{output}</div>

            <View className="ProtogenOutputView-bottom" row justifyEnd p1>
                <button className="min-button" onClick={()=>ctrl.clearApiOutput()}>clear</button>
            </View>

            <style global jsx>{`
                .ProtogenOutputView{
                    position:absolute;
                    top:0;
                    left:0;
                    right:0;
                }
                .ProtogenOutputView-output{
                    white-space:pre;
                    overflow:auto;
                    overflow:overlay;
                    max-height:500px;
                    padding:1rem;
                    font-size:12px;
                    transition:height 0.2s ease-in-out;
                }
                .ProtogenOutputView-bottom{
                    position:absolute;
                    bottom:0;
                    left:0;
                    right:0;
                }
            `}</style>
        </div>
    )

}
