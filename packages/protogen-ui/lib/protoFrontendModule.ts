import { ScopeRegistration, isServerSide } from "@iyio/common";

export const protoFrontendModule=(reg:ScopeRegistration)=>{

    if(isServerSide){
        return;
    }


}
