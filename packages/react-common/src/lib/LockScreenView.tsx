import { atDotCss } from '@iyio/at-dot-css';
import { UiLock, cn } from '@iyio/common';
import { useEffect, useMemo, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { JsonView } from './JsonView.js';
import { LoadingIndicator } from './LoadingIndicator.js';
import { Portal } from './Portal.js';
import { ProgressBar } from './ProgressBar.js';
import { SlimButton } from './SlimButton.js';
import { Text } from './Text.js';
import { View } from './View.js';
import { BasicIcon } from './icon/BasicIcon.js';
import { useSubject } from './rxjs-hooks.js';

interface LockScreenViewProps
{
    lock:UiLock;
    active:boolean;
}

/**
 * @acIgnore
 */
export function LockScreenView({
    lock,
    active,
}:LockScreenViewProps){

    const errorComplete=useMemo(()=>new BehaviorSubject<boolean>(false),[]);
    const error=useSubject(lock.error);
    const [errorShowMore,setErrorShowMore]=useState(false);

    const progress=lock.progress;
    const pro=useSubject(progress?.progressSubject);
    const status=useSubject(progress?.statusSubject);

    useEffect(()=>{
        lock.errorHandler={
            handled:errorComplete
        }
        return ()=>{
            errorComplete.next(true);
        }
    },[lock,errorComplete])

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

    style.root();

    return (
        <Portal>
            <div className={cn("LockScreenView",{show})}>

                {!hide &&
                    <View col g1>
                        <View col g1 alignCenter>
                            {lock.progress?
                                <ProgressBar className={style.progress()} value={pro}/>
                            :
                                <LoadingIndicator />
                            }
                            <Text face2 className="LockScreenView-message" text={lock.message} />
                            {!!status && <Text mt1 face3 className="LockScreenView-message" text={status} />}
                            {error && <>
                                <View row g050>
                                    <SlimButton onClick={()=>setErrorShowMore(!errorShowMore)}>
                                        <Text colorWarn justifyCenter>
                                            {error.errorMessage} <BasicIcon ml050 icon="circle-info"/>
                                        </Text>
                                    </SlimButton>
                                </View>

                                {errorShowMore && <JsonView mv1 value={{
                                    message:error.error?.message,
                                    error:error.error
                                }} />}

                                <SlimButton className="LockScreenView-errorContinue" onClick={()=>errorComplete.next(true)}>Continue</SlimButton>

                            </>}
                        </View>
                    </View>
                }

            </div>
        </Portal>
    )

}

const style=atDotCss({name:'LockScreenView',order:'frameworkHigh',css:`
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
    .LockScreenView-errorContinue{
        font-size:24px;
        font-weight:bold;
    }
    @.progress{
        width:100%;
        max-width:200px;
        align-self:center;
    }
`});
