import { AcComp, AcStyleVars, AnyCompPropsView, AnyCompViewCtrl, acStyle, defaultAcStyle, useCreateAnyCompViewCtrl } from "@iyio/any-comp";
import { atDotCss } from "@iyio/at-dot-css";
import { deleteUndefined } from "@iyio/common";
import { MdxUiBuilder, MdxUiSelectionItem, mdxUiAttsToObject } from "@iyio/mdx-ui-builder";
import { useEffect, useRef, useState } from "react";

export interface MdxUiComponentMenuViewInternalProps
{
    comp:AcComp;
    item:MdxUiSelectionItem;
    builder:MdxUiBuilder;
    styleVars?:Partial<AcStyleVars>;
    onCtrlReady?:(ctrl:AnyCompViewCtrl)=>void;
}

export function MdxUiComponentMenuViewInternal({
    comp,
    item,
    builder,
    styleVars,
    onCtrlReady,
}:MdxUiComponentMenuViewInternalProps){

    const ctrl=useCreateAnyCompViewCtrl(comp);
    const [loaded,setLoaded]=useState(false);

    useEffect(()=>{
        if(!ctrl){
            return;
        }
        ctrl.load({props:mdxUiAttsToObject(item.node.attributes??[])});
        setLoaded(true);

        let iv:any;
        // subscribe to changes after loading init state
        const sub=ctrl.onPropChange.subscribe(v=>{
            clearTimeout(iv);
            iv=setTimeout(()=>{
                builder.setElementProps(item.id,ctrl.computedProps,true);
            },16);
        });
        return ()=>{
            sub.unsubscribe();
        }
    },[ctrl,item]);

    const refs=useRef({onCtrlReady});
    refs.current.onCtrlReady=onCtrlReady;
    useEffect(()=>{
        if(loaded && ctrl){
            refs.current.onCtrlReady?.(ctrl);
        }
    },[ctrl,loaded]);

    if(!loaded){
        return null;
    }

    return (
        <div
            className={style.root()}
            style={acStyle.vars(styleVars?{...defaultAcStyle,...deleteUndefined(styleVars)}:defaultAcStyle)}
        >

            <AnyCompPropsView
                ctrl={ctrl??undefined}
            />

        </div>
    )

}

const style=atDotCss({name:'MdxUiComponentMenuViewInternal',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }
`});
