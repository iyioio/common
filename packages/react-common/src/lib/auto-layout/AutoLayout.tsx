import { atDotCss } from "@iyio/at-dot-css";
import { AutoLayoutType, BaseLayoutProps } from "@iyio/common";
import { Children, useMemo } from "react";
import { AutoLayoutCtrl } from "./AutoLayoutCtrl";
import { AutoLayoutSlot } from "./AutoLayoutSlot";
import { getAutoLayoutTypeComp } from "./_auto-layout-reg";

export interface AutoLayoutProps
{
    children?:any;
    type?:AutoLayoutType;
}

export function AutoLayout({
    children,
    col,
    row,
    colReverse,
    rowReverse,
    type=(
        row?
            'row'
        :col?
            'col'
        :rowReverse?
            'rowReverse'
        :colReverse?
            'colReverse'
        :
            'col'
    ),
    ...props
}:AutoLayoutProps & BaseLayoutProps){

    const ctrl=useMemo(()=>new AutoLayoutCtrl(),[]);
    const childAry=Children.toArray(children);
    const count=childAry.length;

    const info=getAutoLayoutTypeComp(type,childAry,count,ctrl,props);


    return (
        <div className={style.root({[type]:true},info?.className,props)}>

            {info?.comp??childAry.map((c,i)=>(
                <AutoLayoutSlot key={i} index={i}>{c}</AutoLayoutSlot>
            ))}

        </div>
    )

}

const style=atDotCss({name:'AutoLayout',namespace:'iyio',order:'framework',css:`
    @.root{
        display:flex;
    }
    @.root.row{
        flex-direction:row;
    }
    @.root.col{
        flex-direction:column;
    }
    @.root.rowReverse{
        flex-direction:row-reverse;
    }
    @.root.colReverse{
        flex-direction:column-reverse;
    }
`});
