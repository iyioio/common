import { BaseLayoutProps, bcn } from "@iyio/common";
import { CSSProperties, useRef } from "react";

export interface FormProps
{
    onSubmit?:()=>void;
    onSubmitData?:(data:Record<string,any>)=>void;
    defaultData?:Record<string,any>;
    children?:any;
    style?:CSSProperties;

}

export function Form({
    onSubmit,
    onSubmitData,
    defaultData,
    children,
    style,
    ...props
}:FormProps & BaseLayoutProps){

    const refs=useRef({defaultData});
    refs.current.defaultData=defaultData;

    return (
        <form style={style} onSubmit={e=>{
            e.preventDefault();
            onSubmit?.();
            if(onSubmitData && e.target instanceof HTMLFormElement){
                const data:any=new FormData(e.target);
                const value={...refs.current.defaultData,...Object.fromEntries(data.entries())};
                onSubmitData(value);
            }
        }} className={bcn(props,"Form")}>
            {children}
        </form>
    )

}
