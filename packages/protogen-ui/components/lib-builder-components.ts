import { createContext, useContext } from "react";
import { ProtogenCtrl } from "../lib/ProtogenCtrl.js";

export const ProtogenContext=createContext<ProtogenCtrl|null>(null);

export const useProtogenCtrl=()=>{
    const ctrl=useContext(ProtogenContext);
    if(!ctrl){
        throw new Error('useDesignCtrl used outside of ProtogenDesignContext');
    }
    return ctrl;
}
