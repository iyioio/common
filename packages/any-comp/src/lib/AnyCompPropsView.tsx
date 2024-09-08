import { atDotCss } from "@iyio/at-dot-css";
import { SlimButton, Text, View } from "@iyio/react-common";
import { AnyCompPropInput } from "./AnyCompPropInput";
import { AcComp } from "./any-comp-types";

export interface AnyCompPropsViewProps
{
    comp?:AcComp;
    setProps:(props:Record<string,any>|((currentProps:Record<string,any>)=>Record<string,any>))=>void;
    props:Record<string,any>;
    setBindings:(bindings:Record<string,string>|((currentBindings:Record<string,string>)=>Record<string,string>))=>void;
    bindings:Record<string,string>;
    extra?:string;
    setExtra?:(extra:string)=>void;
    applyExtraProps?:()=>void;
}

export function AnyCompPropsView({
    comp,
    props,
    setProps,
    bindings,
    setBindings,
    extra,
    setExtra,
    applyExtraProps
}:AnyCompPropsViewProps){

    return (
        <div className={style.root()}>

            {comp?.props.map(p=>(
                <AnyCompPropInput
                    key={p.name}
                    comp={comp}
                    prop={p}
                    setProps={setProps}
                    props={props}
                    bindings={bindings}
                    setBindings={setBindings}
                />
            ))}

            {setExtra && <View col>
                <Text text="Extra props" />
                <textarea value={extra} onChange={e=>setExtra(e.target.value)} className={style.input()}/>
                <SlimButton onClick={applyExtraProps}>apply</SlimButton>
            </View>}

        </div>
    )

}

const style=atDotCss({name:'AnyCompPropsView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        gap:1rem;
    }
    @.input{
        all:unset;
        background:var(--any-comp-input-bg);
        border-radius:4px;
        padding:0.5rem;
        height:80px;
    }
`});
