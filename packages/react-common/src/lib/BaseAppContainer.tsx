import { BaseLayoutStyleSheet } from "./BaseLayoutStyleSheet";
import { PortalRenderer } from "./PortalRenderer";

export interface BaseAppContainerProps
{
    children?:any;
}

export default function BaseAppContainer({
    children
}:BaseAppContainerProps){

    return (<>
        {children}
        <PortalRenderer/>
        <BaseLayoutStyleSheet/>
    </>)

}
