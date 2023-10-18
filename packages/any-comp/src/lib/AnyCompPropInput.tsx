import { atDotCss } from "@iyio/at-dot-css";
import { SlimButton, Text } from "@iyio/react-common";
import { useEffect, useRef, useState } from "react";
import { AnyCompComment } from "./AnyCompComment";
import { AcComp, AcProp } from "./any-comp-types";

const allNormalInputTypes=['string','number','boolean'] as const;
type NormalInputType=(typeof allNormalInputTypes)[number];
const isNormalInputType=(value:any):value is NormalInputType=>allNormalInputTypes.includes(value);

export interface AnyCompPropInputProps
{
    comp:AcComp;
    prop:AcProp;
    setProps:(props:Record<string,any>|((currentProps:Record<string,any>)=>Record<string,any>))=>void;
    props:Record<string,any>;
    setBindings:(bindings:Record<string,string>|((currentBindings:Record<string,string>)=>Record<string,string>))=>void;
    bindings:Record<string,string>;
}

export function AnyCompPropInput({
    comp,
    prop,
    setProps,
    props,
    bindings,
    setBindings,
}:AnyCompPropInputProps){

    const value=props[prop.name];

    const type=prop.defaultType.type;
    const normalType=isNormalInputType(type)?type:undefined;

    const [error,setError]=useState('');

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

    const setValue=(v:any)=>{
        const newProps={...props};
        newProps[prop.name]=v;
        setProps(newProps);
    }

    const applyJsonValue=()=>{
        try{
            const v=jsonValue.trim();
            if(v){
                const value=JSON.parse(v);
                setValue(value);
            }else{
                setValue(undefined);
            }
        }catch(ex){
            setError((ex as any)?.message??'error');
        }
    }

    useEffect(()=>{
        setError('');
        try{
            setJsonValue(JSON.stringify(value,null,4))
        }catch{
            //
        }
    },[value]);

    const bindTo=bindings[prop.name]??prop.bind;
    const refs=useRef({bindTo});
    refs.current.bindTo=bindTo;

    const [lastCallArgs,setLastCallArgs]=useState('');

    useEffect(()=>{
        if(prop.defaultType.type!=='function'){
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
                setProps(v=>({...v,[b]:args[0]}))
            }
        }

        setProps(v=>({...v,[prop.name]:cb}));
        return ()=>{
            setProps(v=>{
                v={...v};
                delete v[prop.name];
                return v;
            });
        }
    },[prop,comp,setProps]);

    const placeholder=prop.defaultValueText===undefined?undefined:`default = ${prop.defaultValueText}`;


    return (
        <div className={style.root()}>

            <Text text={`${prop.name}${prop.optional?'?':''}: ${prop.sig}`}/>
            <AnyCompComment comment={prop.comment} />

            {!!error && <Text sm colorDanger text={`⛔️ ${error}`} />}

            {normalType==='string'?
                <input
                    className={style.input()}
                    value={value?.toString()}
                    onChange={e=>setValue(e.target.value)}
                    placeholder={placeholder}
                />
            :normalType==='number'?
                <input
                    className={style.input()}
                    type="number"
                    value={value?.toString()}
                    onChange={e=>setValue(Number(e.target.value))}
                    placeholder={placeholder}
                />
            :normalType==='boolean'?
                <input
                    className={style.checkbox()}
                    type="checkbox"
                    value={value?.toString()}
                    onChange={e=>setValue(e.target.checked)}
                    placeholder={placeholder}
                />
            :type==='function'?
                <>
                    <Text text={"bind to"+(prop.bind?`. default = ${prop.bind}`:'')}opacity050 sm />
                    <select
                        className={style.select()}
                        onChange={(e)=>setBindings(v=>({...v,[prop.name]:e.target.value}))}
                        defaultValue={bindTo??prop.bind}
                    >
                        <option value="">(none)</option>
                        {comp.props.map(p=>(p.name===prop.name || p.defaultType.type==='function')?null:(
                            <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                    <Text text="Last call args" opacity050 sm />
                    <Text text={lastCallArgs} sm/>

                </>
            :
                <>
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
                </>
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
        background:var(--any-comp-input-bg);
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
        border:1px solid var(--any-comp-border-color);
    }
`});
