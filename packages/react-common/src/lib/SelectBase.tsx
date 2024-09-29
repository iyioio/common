import { BaseLayoutProps, NamedValue, bcn } from "@iyio/common";
import { useEffect } from "react";

export interface SelectBaseProps<T,D=T>
{
    value?:T;
    onChange?:(value:T|D)=>void;
    options?:NamedValue<T>[];
    displayKey?:keyof T;
    values?:T[];
    tabIndex?:number;
    defaultOption?:NamedValue<D>;
    defaultName?:string;
    passDefaultOption?:boolean;
    disabled?:boolean;
}

export interface SelectBaseInternalProps<T>
{
    unstyled?:boolean;
    elemRef?:(elem:HTMLSelectElement)=>void;
    setOption?:(option:NamedValue<T>|undefined)=>void;
}

/**
 * @acIgnore
 */
export function SelectBase<T,D=T>({
    value,
    onChange,
    options,
    displayKey,
    values,
    unstyled,
    tabIndex,
    elemRef,
    setOption,
    defaultOption,
    defaultName,
    passDefaultOption,
    disabled,
    ...props
}:SelectBaseProps<T,D> & BaseLayoutProps & SelectBaseInternalProps<T>){

    if(!options && values){
        options=values.map<NamedValue<T>>((v,i)=>({
            name:(displayKey?v?.[displayKey]?.toString?.():null)??v?.toString?.()??i.toString(),
            value:v,
        }))
    }

    let index=-1;
    if(options){
        for(let i=0;i<options.length;i++){
            const item=options[i];
            if(item?.value===value){
                index=i;
                break;
            }

        }
    }

    let option=options?.[index] as NamedValue<any>;

    if(defaultOption && index===-1 && value===defaultOption.value){
        index=-2;
        if(passDefaultOption){
            option=defaultOption;
        }
    }


    useEffect(()=>{
        setOption?.(option);
    },[setOption,option]);

    return (
        <select
            ref={elemRef}
            disabled={disabled}
            tabIndex={tabIndex}
            className={unstyled?undefined:bcn(props)}
            value={index.toString()}
            onChange={e=>{
                const item=e.target.value==='-2'?defaultOption:options?.[Number(e.target.value)];
                if(item===undefined){
                    return;
                }
                onChange?.(item.value as any);
            }}
        >
            {defaultName && <option value="-3">{defaultName}</option>}
            {defaultOption && <option value="-2">{defaultOption.name}</option>}
            {options?.map((item,i)=>(
                <option key={i} value={i.toString()}>{item.name}</option>
            ))}
        </select>
    )

}
