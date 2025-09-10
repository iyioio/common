import { cn } from "@iyio/common";
import { ButtonBase, ButtonBaseProps } from "@iyio/react-common";
import { dt } from "../lib/lib-design-tokens.js";
import { UiState } from "../lib/protogen-ui-lib.js";

interface ProtoButtonProps extends ButtonBaseProps
{
    active?:boolean;
    state?:UiState;
    info?:boolean;
    success?:boolean;
    warn?:boolean;
    danger?:boolean;
    text?:string;
    children?:any;
}

export function ProtoButton({
    active,
    state,
    info,
    success,
    warn,
    danger,
    text,
    children,
    ...props
}:ProtoButtonProps){

    return (
        <ButtonBase baseClassName={cn("ProtoButton",{active,success,warn,danger,info,[state??'none']:state})} {...props}>
            {text}
            {children}
            <style global jsx>{`
                .ProtoButton{
                    border:none;
                    border-radius:4px;
                    background:transparent;
                    padding:4px;
                    color:${dt().mutedColor}99;
                    font-weight:bold;
                    transition:opacity 0.1s ease-in-out, color 0.1s ease-in-out, background-color 0.1s ease-in-out;
                    cursor:pointer;
                    outline:none;
                }
                .ProtoButton:focus{
                    background-color:${dt().mutedColor}33;
                }
                .ProtoButton:active, .ProtoButton:hover, .ProtoButton.active{
                    color:${dt().mutedColor};
                }
                .ProtoButton.info{
                    color:${dt().infoColor};
                }
                .ProtoButton.success{
                    color:${dt().successColor};
                    outline-color:${dt().successColor};
                }
                .ProtoButton.warn{
                    color:${dt().warnColor};
                }
                .ProtoButton.danger{
                    color:${dt().dangerColor};
                }
            `}</style>
        </ButtonBase>
    )

}
