import { GoogleTagManagerConfig, initGoogleTagManager, isGoogleTagManagerEnabled } from "@iyio/common";
import { useEffect, useRef } from "react";

/**
 * Initializes the google tag manager. Only the first value passed to useGoogleTagManager will have
 * an effect so you don't need to use a memo.
 */
export const useGoogleTagManager=(config:GoogleTagManagerConfig|null|undefined|string)=>{

    const refs=useRef({config});
    useEffect(()=>{
        if(!isGoogleTagManagerEnabled() && refs.current.config){
            initGoogleTagManager(refs.current.config);
        }
    },[]);
}
