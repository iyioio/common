import { atDotCss } from "@iyio/at-dot-css";
import { SlimButton, Text } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl.js";
import { acStyle } from "./any-comp-style.js";

export interface AnyCompExtraPropsInputProps
{
    ctrl?:AnyCompViewCtrl;
}

export function AnyCompExtraPropsInput({
    ctrl
}:AnyCompExtraPropsInputProps){

    const [extra,setExtra]=useState(ctrl?.extra??'');

    useEffect(()=>{
        setExtra(ctrl?.extra??'');
    },[ctrl]);

    return (
        <div className={style.root()}>
            <Text text="Extra props" />
            <textarea value={extra} onChange={e=>setExtra(e.target.value)} className={style.input()}/>
            <SlimButton onClick={()=>{
                if(ctrl){
                    ctrl.extra=extra;
                }
            }}>apply</SlimButton>
        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AnyCompExtraPropsInput',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
    @.input{
        all:unset;
        background:${acStyle.var('inputBg')};
        border-radius:4px;
        padding:0.5rem;
        height:80px;
    }
`});
