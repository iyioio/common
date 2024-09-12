import { atDotCss } from "@iyio/at-dot-css";
import { Text, useSubject } from "@iyio/react-common";
import { useEffect, useRef, useState } from "react";
import { AnyCompComment } from "./AnyCompComment";
import { AnyCompJsonInput } from "./AnyCompJsonInput";
import { AnyCompUnionInput } from "./AnyCompUnionInput";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl";
import { useUpdateOnAnyCompPropChange } from "./any-comp-react-lib";
import { acStyle } from "./any-comp-style";
import { AcProp } from "./any-comp-types";


export interface AnyCompPropInputProps
{
    ctrl:AnyCompViewCtrl;
    prop:AcProp;
}

export function AnyCompPropInput({
    ctrl,
    prop,
}:AnyCompPropInputProps){

    console.log('hio 👋 👋 👋 changed',prop.name);

    const comp=ctrl.comp;

    useUpdateOnAnyCompPropChange(ctrl,prop.name);

    const value=ctrl.props[prop.name];
    const type=prop.type.type;

    const [error,setError]=useState('');



    const bindings=useSubject(ctrl.bindingsSubject);
    const bindTo=bindings[prop.name]??prop.bind;
    const refs=useRef({bindTo});
    refs.current.bindTo=bindTo;

    const [lastCallArgs,setLastCallArgs]=useState('');

    useEffect(()=>{
        if(prop.type.type!=='function'){
            return;
        }
        const cb=(...args:any[])=>{
            console.info(`invoke ${comp.name}.${prop.name}`,...args);
            try{
                setLastCallArgs(JSON.stringify(args));
            }catch{
                try{
                    setLastCallArgs(args?.toString())
                }catch{
                    setLastCallArgs('[args]')
                }
            }
            const b=refs.current.bindTo;
            if(b){
                ctrl.setProp(b,args[0])
            }
        }

        ctrl.setProp(prop.name,cb);
        return ()=>{
            ctrl.setProp(prop.name,undefined);
        }
    },[prop,comp,ctrl]);

    const placeholder=prop.defaultValueText===undefined?undefined:`default = ${prop.defaultValueText}`;


    return (
        <div className={style.root()}>

            <Text text={`${prop.name}${prop.o?'?':''}: ${prop.sig}`}/>
            <AnyCompComment comment={prop.comment} />

            {!!error && <Text sm colorDanger text={`⛔️ ${error}`} />}

            {type==='string'?
                <input
                    className={style.input()}
                    value={value?.toString()??''}
                    onChange={e=>ctrl.setProp(prop.name,e.target.value)}
                    placeholder={placeholder}
                />
            :type==='number'?
                <input
                    className={style.input()}
                    type="number"
                    value={value?.toString()??''}
                    onChange={e=>ctrl.setProp(prop.name,Number(e.target.value))}
                    placeholder={placeholder}
                />
            :type==='boolean'?
                <input
                    className={style.checkbox()}
                    type="checkbox"
                    checked={value??false}
                    onChange={e=>ctrl.setProp(prop.name,e.target.checked)}
                    placeholder={placeholder}
                />
            :type==='function'?
                <>
                    <Text text={"bind to"+(prop.bind?`. default = ${prop.bind}`:'')}opacity050 sm />
                    <select
                        className={style.select()}
                        onChange={(e)=>ctrl.bindings={...ctrl.bindings,[prop.name]:e.target.value}}
                        defaultValue={bindTo??prop.bind}
                    >
                        <option value="">(none)</option>
                        {comp.props.map(p=>(p.name===prop.name || p.type.type==='function')?null:(
                            <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                    <Text text="Last call args" opacity050 sm />
                    <Text text={lastCallArgs} sm/>

                </>
            :type==='union'?
                <AnyCompUnionInput ctrl={ctrl} prop={prop} />
            :
                <AnyCompJsonInput ctrl={ctrl} prop={prop} placeholder={placeholder} setError={setError} />
            }

        </div>
    )

}

const style=atDotCss({name:'AnyCompPropInput',css:`
    @.root{
        display:flex;
        flex-direction:column;
        gap:0.5rem;
    }
    @.input{
        all:unset;
        background:${acStyle.var('inputBg')};
        border-radius:4px;
        padding:0.5rem;
    }
    @.checkbox{
        align-self:flex-start;
        width:1rem;
        height:1rem;
    }
    @.select{
        all:unset;
        border:1px solid #ffff;
        padding:0.5rem;
        border-radius:8px;
        cursor:pointer;
        align-self:stretch;
        overflow:hidden;
        width:100%;
        box-sizing:border-box;
        border:1px solid ${acStyle.var('borderColor')};
    }
`});
