import { baseLayoutCn, BaseLayoutInnerProps, cn, css } from "@iyio/common";
import Style from 'styled-jsx/style';
import { Portal } from "./Portal";
import { PortalProps } from "./portal-lib";

export interface ModalBaseProps extends PortalProps, BaseLayoutInnerProps
{
    open:boolean;
    closeRequested?:(open:false)=>void;
    background?:string;
}

export function ModalBase({
    rendererId,
    open,
    closeRequested,
    children,
    background,
    ...props
}:ModalBaseProps){

    if(!open){
        return null;
    }

    return (
        <>
            <Portal rendererId={rendererId}>
                <div className={cn('ModelBase',baseLayoutCn(props))}>

                    <div className="ModelBase-bg" style={{background}} onClick={()=>closeRequested?.(false)}/>

                    <div className="ModelBase-content">
                        {children}
                    </div>
                </div>
            </Portal>

            <Style id="tyEOMxC0RWXJwy3bzQEI" global jsx>{css`
                .ModelBase, .ModelBase-bg{
                    position:absolute;
                    left:0;
                    right:0;
                    top:0;
                    bottom:0;
                }
                .ModelBase-content{
                    position:relative;
                    display:flex;
                    flex-direction:column;
                }
            `}</Style>
        </>
    )

}
