import { AcComp, AcStyleVars, AnyCompPropsView, acStyle, defaultAcStyle, useCreateAnyCompViewCtrl } from "@iyio/any-comp";
import { atDotCss } from "@iyio/at-dot-css";
import { deleteUndefined } from "@iyio/common";
import { MdxUiBuilder, MdxUiSelectionItem, mdxUiAttsToObject } from "@iyio/mdx-ui-builder";
import { useEffect } from "react";

export interface MdxUiComponentMenuViewInternalProps
{
    comp:AcComp;
    item:MdxUiSelectionItem;
    builder:MdxUiBuilder;
    styleVars?:Partial<AcStyleVars>;
}

export function MdxUiComponentMenuViewInternal({
    comp,
    item,
    builder,
    styleVars,
}:MdxUiComponentMenuViewInternalProps){

    const ctrl=useCreateAnyCompViewCtrl(comp);

    useEffect(()=>{
        if(!ctrl){
            return;
        }
        ctrl.load({props:mdxUiAttsToObject(item.node.attributes??[])});

        let iv:any;
        // subscribe to changes after loading init state
        const sub=ctrl.onPropChange.subscribe(v=>{
            clearTimeout(iv);
            iv=setTimeout(()=>{
                builder.setElementProps(item.id,ctrl.computedProps,true);
            },500);
        });
        return ()=>{
            sub.unsubscribe();
        }
    },[ctrl,item]);


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
