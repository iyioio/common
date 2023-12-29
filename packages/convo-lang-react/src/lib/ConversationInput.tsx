import { atDotCss } from "@iyio/at-dot-css";
import { ConversationUiCtrl } from "@iyio/convo-lang";
import { useState } from "react";
import { useConversationTheme, useConversationUiCtrl } from "./convo-lang-react";

export interface ConversationInputProps
{
    ctrl?:ConversationUiCtrl;
    className?:string;
    inputName?:string;
    inputType?:string;
    inputClassName?:string;
    placeholder?:string;
}

export function ConversationInput({
    ctrl: _ctrl,
    inputName,
    inputType='text',
    className,
    inputClassName,
    placeholder='Enter message',
}:ConversationInputProps){

    const ctrl=useConversationUiCtrl(_ctrl);

    const theme=useConversationTheme(_ctrl);

    const [value,setValue]=useState('');


    return (
        <form
            className={style.root(null,className)}
            style={style.vars(theme)}
            onSubmit={e=>{
                e.preventDefault();
                if(ctrl.currentTask){
                    return;
                }
                setValue('');
                ctrl.appendUiMessageAsync(value);
            }}
        >

            <input
                className={style.input(null,inputClassName)}
                placeholder={placeholder}
                name={inputName}
                type={inputType}
                value={value}
                onChange={e=>setValue(e.target.value)}
            />

        </form>
    )

}

const style=atDotCss({name:'ConversationInput',css:`
    @.root{
        display:flex;
        flex-direction:row;
    }
    @.input{
        all:unset;
        cursor:text;
        flex:1;
        background:@@inputBackground;
        padding:@@inputPadding;
        border-radius:@@borderRadius;
        margin:@@inputMargin;
        box-shadow:@@inputShadow;
        border:@@inputBorder;
        background-clip:padding-box;
    }
`});
