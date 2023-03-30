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
        <div className="ProtogenToolbar node-container">
            <View flex1 g1>
                <button className={'min-button '+(mode==='all'?'active':'')} onClick={()=>ctrl.viewMode='all'}>more</button>
                <button className={'min-button '+(mode==='atts'?'active':'')} onClick={()=>ctrl.viewMode='atts'}>less</button>
                <button className={'min-button '+(mode==='children'?'active':'')} onClick={()=>ctrl.viewMode='children'}>min</button>
            </View>
            <View row justifyCenter alignCenter flex1 g1 className="ProtogenToolbar-message">
                {activeAnchor?'( Select a connecting point )':''}
            </View>
            <View row flex1 justifyEnd g1>
                <button className="min-button" onClick={()=>ctrl.saveAsync({executePipeline:true})}>execute</button>
                <button className="min-button" onClick={()=>ctrl.saveAsync()}>save</button>
            </View>


            <style global jsx>{`
                .ProtogenToolbar{
                    position:absolute;
                    left:0;
                    right:0;
                    bottom:0;
                    display:flex;
                    padding:4px ${dt().containerPadding};
                }
                .ProtogenToolbar-message{
                    opacity:0.5;
                    font-size:12px;
                }
            `}</style>
        </div>
    )

}
