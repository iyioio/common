import { BaseLayoutProps, bcn } from "@iyio/common";

export interface FormProps
{
    onSubmit?:()=>void;
    children?:any;

}

export function Form({
    onSubmit,
    children,
    ...props
}:FormProps & BaseLayoutProps){

    return (
        <form onSubmit={e=>{
            e.preventDefault();
            onSubmit?.();
        }} className={bcn(props,"Form")}>
            {children}
        </form>
    )

}
