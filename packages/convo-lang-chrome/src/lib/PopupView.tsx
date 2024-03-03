import { atDotCss } from "@iyio/at-dot-css";
import { BaseAppContainer, BaseAppContainerProps } from '@iyio/react-common';
import { useEffect, useMemo } from "react";
import { PopupCtrl } from "./PopupCtrl";
import { TaskView } from "./TaskView";

export type PopupViewProps=BaseAppContainerProps;

export function PopupView(props:PopupViewProps){

    const ctrl=useMemo(()=>new PopupCtrl(),[]);

    useEffect(()=>{
        return ()=>{
            ctrl.dispose();
        }
    },[ctrl]);

    return (
        <BaseAppContainer
            insertSharedStyleSheets
            enableRouteRedirectFallback={false}
            initBeforeRender
            {...props}
        >
            <div className={style.root()}>

                <TaskView ctrl={ctrl}/>

            </div>
        </BaseAppContainer>
    )

}

const style=atDotCss({name:'PopupView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        flex:1;
        min-width:300px;
        min-height:500px;

    }
`});
