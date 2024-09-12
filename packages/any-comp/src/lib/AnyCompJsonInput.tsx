import { atDotCss } from "@iyio/at-dot-css";
import { SlimButton } from "@iyio/react-common";
import { useEffect, useRef, useState } from "react";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl";
import { acStyle } from "./any-comp-style";
import { AcProp } from "./any-comp-types";


const allNormalInputTypes=['string','number','boolean'] as const;
type NormalInputType=(typeof allNormalInputTypes)[number];
const isNormalInputType=(value:any):value is NormalInputType=>allNormalInputTypes.includes(value);

export interface AnyCompJsonInputProps
{
    ctrl:AnyCompViewCtrl;
    prop:AcProp;
    placeholder?:string;
    setError?:(error:string)=>void;
}

export function AnyCompJsonInput({
    ctrl,
    prop,
    placeholder,
    setError
}:AnyCompJsonInputProps){

    const refs=useRef({setError});
    refs.current.setError=setError;


    const value=ctrl.props[prop.name];
    const type=prop.type.type;

    const normalType=isNormalInputType(type)?type:undefined;

    const [jsonValue,setJsonValue]=useState(()=>{
        if(normalType){
            return '';
        }
        try{
            return JSON.stringify(value,null,4);
        }catch{
            return '';
        }
    });

    const applyJsonValue=()=>{
        try{
            const v=jsonValue.trim();
            if(v){
                const value=JSON.parse(v);
                ctrl.setProp(prop.name,value);
            }else{
                ctrl.setProp(prop.name,undefined);
            }
        }catch(ex){
            refs.current.setError?.((ex as any)?.message??'error');
        }
    }

    useEffect(()=>{
        refs.current.setError?.('');
        try{
            setJsonValue(JSON.stringify(value,null,4))
        }catch{
            //
        }
    },[value]);

    return (
        <div className={style.root()}>

            <textarea
                className={style.input()}
                placeholder={placeholder??'undefined'}
                value={jsonValue}
                onBlur={applyJsonValue}
                onChange={v=>setJsonValue(v.target.value)}
                onKeyDown={e=>{
                    if((e.shiftKey || e.ctrlKey || e.metaKey) && e.key==='Enter'){
                        applyJsonValue();
                        e.preventDefault();
                    }
                }}
            />
            <SlimButton onClick={applyJsonValue}>apply</SlimButton>

        </div>
    )

}

const style=atDotCss({name:'AnyCompJsonInput',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }

    @.input{
        all:unset;
        background:${acStyle.var('inputBg')};
        border-radius:4px;
        padding:0.5rem;
    }
`});
