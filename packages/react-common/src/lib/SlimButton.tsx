import { BaseLayoutProps, css } from '@iyio/common';
import Style from 'styled-jsx/style';
import { ButtonBase, ButtonBaseProps } from "./ButtonBase";

export type SlimButtonProps = ButtonBaseProps & BaseLayoutProps;

export function SlimButton({
    children,
    ...props
}:SlimButtonProps){

    return (
        <ButtonBase {...props} baseClassName="SlimButton">
            {children}
            <Style id="iyio-SlimButton-tbCcmdWT9eWU4kWaw3SD" global jsx>{css`
                .SlimButton{
                    display:flex;
                    border:none;
                    padding:0;
                    margin:0;
                    background:none;
                    cursor:pointer;
                }
            `}</Style>
        </ButtonBase>
    )

}
