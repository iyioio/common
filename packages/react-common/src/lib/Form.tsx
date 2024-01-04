import { BaseLayoutProps, bcn } from "@iyio/common";
import { CSSProperties } from "react";

export interface FormProps
{
    onSubmit?:()=>void;
    children?:any;
    style?:CSSProperties;

}

export function Form({
    onSubmit,
    children,
    style,
    ...props
}:FormProps & BaseLayoutProps){

    return (
        <form style={style} onSubmit={e=>{
            e.preventDefault();
            onSubmit?.();
        }} className={bcn(props,"Form")}>
            {children}
        </form>
    )

}
