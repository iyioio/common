import { UiLock, cn, css } from '@iyio/common';
import { useEffect, useState } from 'react';
import Style from 'styled-jsx/style';
import { LoadingIndicator } from './LoadingIndicator';
import { Portal } from './Portal';
import { Text } from './Text';
import { View } from './View';

interface LockScreenViewProps
{
    lock:UiLock;
    active:boolean;
}

export function LockScreenView({
    lock,
    active,
}:LockScreenViewProps){

    const [delayFinished,setDelayFinished]=useState(false);
    useEffect(()=>{
        let m=true;
        setTimeout(()=>{
            if(m){
                setDelayFinished(true);
            }
        },20)
        return ()=>{m=false}
    },[])

    const show=active && lock.active && delayFinished;
    const [hide,setHide]=useState(false);

    useEffect(()=>{
        if(show){
            setHide(false);
            return;
        }

        let m=true;
        setTimeout(()=>{
            if(m){
                setHide(true);
            }
        },2000);
        return ()=>{
            m=false;
        }
    },[show]);

    return (
        <Portal>
            <div className={cn("LockScreenView",{show})}>

                {!hide &&
                    <View col g1>
                        <View col g1 alignCenter>
                            <LoadingIndicator />
                            <Text face2 className="LockScreenView-message" text={lock.message} />
                        </View>
                        {lock.progress && /*<LockProgress progress={lock.progress}/>*/null}
                    </View>
                }

                <Style id="iyio-LockScreenView-ypYlv97yWpmo1zpkHS1i" global jsx>{css`
                    .LockScreenView{
                        display:flex;
                        flex-direction:column;
                        justify-content:center;
                        position:absolute;
                        left:0;
                        right:0;
                        top:0;
                        bottom:0;
                        background-color:#000000cc;
                        opacity:0;
                        transition:opacity 0.2s ease-in-out;
                        pointer-events:none;
                        z-index:9999;
                    }
                    .LockScreenView.show{
                        opacity:1;
                        pointer-events:auto;
                    }
                `}</Style>
            </div>
        </Portal>
    )

}
