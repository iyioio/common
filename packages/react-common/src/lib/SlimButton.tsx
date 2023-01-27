import { BaseLayoutProps } from '@iyio/common';
import { ButtonBase, ButtonBaseProps } from "./ButtonBase";

export type SlimButtonProps = ButtonBaseProps & BaseLayoutProps & {unstyled?:boolean};

export function SlimButton({
    unstyled,
    children,
    ...props
}:SlimButtonProps){

    return (
        <ButtonBase {...props} baseClassName={unstyled?undefined:"SlimButton"}>
            {children}
        </ButtonBase>
    )

}
