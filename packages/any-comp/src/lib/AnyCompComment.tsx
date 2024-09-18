import { atDotCss } from "@iyio/at-dot-css";
import { SlimButton, Text, TextProps } from "@iyio/react-common";
import { useState } from "react";

export interface AnyCompCommentProps
{
    comment?:string;
}

export function AnyCompComment({
    comment,
    className,
    ...props
}:AnyCompCommentProps & Omit<TextProps,'text'>){

    if(!comment){
        return null;
    }

    const hasNewline=comment.includes('\n');

    const [open,setOpen]=useState(false);

    return (
        <Text {...props} className={style.root(null,className)}>
            {open?comment:comment.split('\n')[0]}
            {hasNewline&&<SlimButton onClick={()=>setOpen(!open)}>{open?'🔼':'🔽'}</SlimButton>}
        </Text>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AnyCompComment',css:`
    @.root{
        white-space:pre-wrap;
        display:flex;
        gap:1rem;
        opacity:0.5;
    }
`});
