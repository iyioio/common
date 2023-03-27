import { useSubject, View } from "@iyio/react-common";
import { dt } from "../lib/lib-design-tokens";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";

interface ProtogenToolbarProps
{
    ctrl:ProtogenCtrl;
}

export function ProtogenToolbar({
    ctrl
}:ProtogenToolbarProps){

    const activeAnchor=useSubject(ctrl.activeAnchorSubject);
    const mode=useSubject(ctrl.viewModeSubject);

    return (
        <div className="ProtogenToolbar">
            <View flex1 g1>
                <button className={mode==='all'?'active':''} onClick={()=>ctrl.viewMode='all'}>more</button>
                <button className={mode==='atts'?'active':''} onClick={()=>ctrl.viewMode='atts'}>less</button>
                <button className={mode==='children'?'active':''} onClick={()=>ctrl.viewMode='children'}>min</button>
            </View>
            <View row justifyCenter alignCenter flex1 g1 className="ProtogenToolbar-message">
                {activeAnchor?'( Select a connecting point )':''}
            </View>
            <View row flex1 justifyEnd g1>
                <button onClick={()=>ctrl.exportAsync()}>export</button>
            </View>


            <style global jsx>{`
                .ProtogenToolbar{
                    position:absolute;
                    left:0;
                    right:0;
                    bottom:0;
                    display:flex;
                    padding:4px ${dt().containerPadding};
                    background:${dt().entityBgColor};
                }
                .ProtogenToolbar button{
                    border:none;
                    border-radius:4px;
                    background:transparent;
                    padding:4px;
                    color:${dt().mutedColor}99;
                    font-weight:bold;
                    transition:opacity 0.1s ease-in-out;
                    cursor:pointer;
                }
                .ProtogenToolbar button:active, .ProtogenToolbar button.active{
                    color:${dt().mutedColor};
                }
                .ProtogenToolbar-message{
                    opacity:0.5;
                    font-size:12px;
                }
            `}</style>
        </div>
    )

}
