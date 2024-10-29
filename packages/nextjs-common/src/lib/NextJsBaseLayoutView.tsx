import { BaseLayoutProps } from "@iyio/common";
import { BaseLayoutView, BaseLayoutViewProps } from "@iyio/react-common";
import { NextJsStyleSheets } from "./NextJsStyleSheets";

export interface NextJsBaseLayoutViewProps extends BaseLayoutViewProps
{
    disableNextJsStyleSheets?:boolean;
}

export function NextJsBaseLayoutView({
    children,
    disableDomStyleSheets=true,
    disableNextJsStyleSheets,
    ...props
}:NextJsBaseLayoutViewProps & BaseLayoutProps){

    return (
        <BaseLayoutView disableDomStyleSheets={disableDomStyleSheets} {...props}>
            {!disableNextJsStyleSheets && <NextJsStyleSheets/>}
            {children}
        </BaseLayoutView>
    )

}
