import { ScopeRegistration } from "@iyio/common";
import { BaseAppContainer, BaseAppContainerProps } from "@iyio/react-common";
import { useCallback, useRef } from "react";
import { nextJsModule } from "./_modules.nextjs-common";

export interface NextJsAppContainerProps extends Omit<BaseAppContainerProps,'scopeInit'>
{
    scopeInit?:(reg:ScopeRegistration)=>void;
}

export function NextJsAppContainer({
    children,
    scopeInit,
    ...props
}:NextJsAppContainerProps){

    const scopeInitRef=useRef(scopeInit);
    const init=useCallback((reg:ScopeRegistration)=>{
        reg.use(nextJsModule);
        scopeInitRef.current?.(reg);
    },[])

    return (
        <BaseAppContainer {...props} scopeInit={init}>
            {children}
        </BaseAppContainer>
    )

}
