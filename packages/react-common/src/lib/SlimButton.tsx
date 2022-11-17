import { BaseLayoutProps } from "./base-layout";
import { ButtonBase, ButtonBaseProps } from "./ButtonBase";

export interface SlimButtonProps extends ButtonBaseProps, BaseLayoutProps
{

}

export function SlimButton({
    children,
    ...props
}:SlimButtonProps){

    return (
        <ButtonBase {...props} baseClassName="SlimButton">
            {children}
            <style global jsx>{`
                .SlimButton{
                    display:flex;
                    border:none;
                    padding:0;
                    margin:0;
                    background:none;
                    cursor:pointer;
                }
            `}</style>
        </ButtonBase>
    )

}
