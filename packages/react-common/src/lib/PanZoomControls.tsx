import { atDotCss } from "@iyio/at-dot-css";
import { PanZoomCtrl } from "./PanZoomView.js";
import { SlimButton } from "./SlimButton.js";

export interface PanZoomControlsProps
{
    ctrl:PanZoomCtrl;
    zoomInIcon?:any;
    zoomOutIcon?:any;
    className?:string;
    classNameOverride?:string;
    radius?:string;
    btnSize?:string;
    bgColor?:string;
}

export function PanZoomControls({
    ctrl,
    zoomInIcon='+',
    zoomOutIcon='-',
    className,
    classNameOverride,
    radius='4px',
    btnSize='30px',
    bgColor='#00000099',
}:PanZoomControlsProps){

    return (
        <div className={classNameOverride??style.root(null,className)} style={style.vars({radius,btnSize,bgColor})}>

            <SlimButton className={style.zoomIn()} onClick={()=>ctrl.zoom(0.2)}>
                {zoomInIcon}
            </SlimButton>

            <SlimButton className={style.zoomOut()} onClick={()=>ctrl.zoom(-0.2)}>
                {zoomOutIcon}
            </SlimButton>

        </div>
    )

}

const style=atDotCss({name:'PanZoomControls',order:'framework',css:`
    @.root{
        display:flex;
        flex-direction:column;
        position:absolute;
        right:0;
        top:0;
        border-radius:@@radius;
    }

    @.zoomIn, @.zoomOut{
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
        background:@@bgColor;
        width:@@btnSize;
        height:@@btnSize;
    }

    @.zoomIn{
        border-top-left-radius:@@radius;
        border-top-right-radius:@@radius;
    }
    @.zoomOut{
        border-bottom-left-radius:@@radius;
        border-bottom-right-radius:@@radius;
    }
`});
