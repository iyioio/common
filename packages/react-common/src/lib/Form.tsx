import { BaseLayoutProps, bcn } from "@iyio/common";
import { CSSProperties } from "react";

export interface FormProps
{
    onSubmit?:()=>void;
    onSubmitData?:(data:Record<string,any>)=>void;
    children?:any;
    style?:CSSProperties;

}

export function Form({
    onSubmit,
    onSubmitData,
    children,
    style,
    ...props
}:FormProps & BaseLayoutProps){

    return (
        <form style={style} onSubmit={e=>{
            e.preventDefault();
            onSubmit?.();
            if(onSubmitData && e.target instanceof HTMLFormElement){
                const data:any=new FormData(e.target);
                const value=Object.fromEntries(data.entries());
                onSubmitData(value);
            }
        }} className={bcn(props,"Form")}>
            {children}
        </form>
    )

}
