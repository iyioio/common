import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps, NamedValue } from "@iyio/common";
import { useEffect, useState } from "react";
import { SelectBase, SelectBaseProps } from "./SelectBase";

const defaultItemRenderer=(option:NamedValue<any>|undefined,placeholder:string)=>option?.name??placeholder;

export interface SelectWrapperBaseProps<T,D=T> extends SelectBaseProps<T,D>
{
    placeholder?:string;
}

export interface SelectWrapperProps<T,D=T> extends SelectWrapperBaseProps<T,D>
{
    renderItem?:(option:NamedValue<T>|undefined,placeholder:string)=>any;
    children?:any;
}

export function SelectWrapper<T,D=T>({
    placeholder='(none)',
    defaultName=placeholder,
    renderItem=defaultItemRenderer,
    children,
    ...props
}:SelectWrapperProps<T,D> & BaseLayoutProps){

    const [elem,setElem]=useState<HTMLSelectElement|null>(null);
    const [option,setOption]=useState<NamedValue<T>|undefined>(undefined);

    const [focus,setFocus]=useState(false);
    useEffect(()=>{
        if(!elem){
            return;
        }
        const listener=()=>{
            setFocus(document.activeElement===elem);
        }
        elem.addEventListener('focus',listener);
        elem.addEventListener('blur',listener);
        listener();
        return ()=>{
            elem.removeEventListener('focus',listener);
            elem.removeEventListener('blur',listener);
        }
    },[elem]);

    return (
        <div className={style.root({focus},null,props)}>

            {renderItem(option,placeholder)}

            {children}

            <SelectBase
                {...props}
                unstyled
                elemRef={setElem}
                defaultName={defaultName}
                setOption={setOption}
            />

        </div>
    )

}

const style=atDotCss({name:'SelectWrapper',namespace:'iyio',order:'frameworkHigh',css:`
    @.root{
        display:flex;
        position:relative;
    }
    @.root select{
        position:absolute;
        left:0;
        top:0;
        width:100%;
        height:100%;
        opacity:0;
        cursor:pointer;
    }
`});
