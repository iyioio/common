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

    return (
        <div className="ProtogenToolbar">
            <View flex1></View>
            <View row justifyCenter alignCenter flex1 className="ProtogenToolbar-message">
                {activeAnchor?'( Select a connecting point )':''}
            </View>
            <View row flex1 justifyEnd>
                <button onClick={()=>ctrl.exportAsync()}>Export</button>
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
                    color:${dt().mutedColor};
                    font-weight:bold;
                    transition:opacity 0.1s ease-in-out;
                }
                .ProtogenToolbar button:active{
                    opacity:0.5;
                }
                .ProtogenToolbar-message{
                    opacity:0.5;
                    font-size:12px;
                }
            `}</style>
        </div>
    )

}
