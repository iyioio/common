import { BaseLayoutProps, bcn } from "@iyio/common";
import { BaseLayoutStyleSheet } from "./BaseLayoutStyleSheet";
import { useDomSharedStyleSheets } from "./useDomSharedStyleSheets";

export interface BaseLayoutViewProps
{
    disableDomStyleSheets?:boolean;
    children?:any;
}

export function BaseLayoutView({
    disableDomStyleSheets,
    children,
    ...props
}:BaseLayoutViewProps & BaseLayoutProps){

    useDomSharedStyleSheets(!disableDomStyleSheets)

    return (
        <div className={bcn(props,'BaseLayoutView')}>
            {children}
            <BaseLayoutStyleSheet/>
        </div>
    )

}
