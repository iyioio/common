import { AcComp, AnyCompPropsView } from "@iyio/any-comp";
import { atDotCss } from "@iyio/at-dot-css";
import { MdxUiBuilder, MdxUiSelectionItem, mdxUiAttsToObject } from "@iyio/mdx-ui-builder";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface MdxUiComponentMenuViewInternalProps
{
    comp:AcComp;
    item:MdxUiSelectionItem;
    builder:MdxUiBuilder;
    foregroundColor?:string;
}

export function MdxUiComponentMenuViewInternal({
    comp,
    item,
    builder,
    foregroundColor='#000000',
}:MdxUiComponentMenuViewInternalProps){

    const defaultProps=useMemo(()=>mdxUiAttsToObject(item.node.attributes??[]),[item]);
    const [props,_setProps]=useState<Record<string,any>>(defaultProps);
    const [applyChanges,setApplyChanges]=useState(false);
    const setProps=useCallback((value:Record<string,any>)=>{
        _setProps(value);
        setApplyChanges(true);
    },[])
    const [bindings,setBindings]=useState<Record<string,string>>({});

    const [extra,setExtra]=useState('{\n\n}');
    const [extraProps,_setExtraProps]=useState<Record<string,any>>({});
    const setExtraProps=useCallback((value:Record<string,any>)=>{
        _setExtraProps(value);
        setApplyChanges(true);
    },[])
    const compProps=useMemo(()=>({...props,...extraProps}),[props,extraProps]);

    useEffect(()=>{

        if(!applyChanges){
            return;
        }

        const iv=setTimeout(()=>{
            builder.setElementProps(item.id,compProps,true);
        },500);

        return ()=>{
            clearTimeout(iv);
        }
    },[compProps,builder,applyChanges]);

    const applyExtraProps=()=>{
        try{
            setExtraProps(JSON.parse(extra))
        }catch(ex){
            console.error('Unable to set extra props',ex);
        }
    }


    return (
        <div className={style.root()} style={style.vars({
            foregroundColor,
            inputBg:`${foregroundColor}33`,
            borderColor:`${foregroundColor}33`,
        })}>

            <AnyCompPropsView
                comp={comp}
                props={props}
                setProps={setProps}
                bindings={bindings}
                setBindings={setBindings}
                extra={extra}
                setExtra={setExtra}
                applyExtraProps={applyExtraProps}
            />

        </div>
    )

}

const style=atDotCss({name:'MdxUiComponentMenuView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        --any-comp-foreground-color:@@foregroundColor;
        --any-comp-input-bg:@@inputBg;
        --any-comp-border-color:@@borderColor;
    }
`});
