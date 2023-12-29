import { atDotCss } from "@iyio/at-dot-css";
import { ConversationUiCtrl, ConvoEditorMode } from '@iyio/convo-lang';
import { useShallowCompareItem, useSubject } from "@iyio/react-common";
import { useContext, useEffect, useMemo } from "react";
import { ConversationInput, ConversationInputProps } from "./ConversationInput";
import { MessagesSourceView } from "./MessagesSourceView";
import { MessagesView } from "./MessagesView";
import { ConversationUiContext } from "./convo-lang-react";
import { ConvoLangTheme, defaultDarkConvoLangTheme, defaultLightConvoLangTheme } from "./convo-lang-theme";

export interface ConversationViewProps
{
    className?:string;
    ctrl?:ConversationUiCtrl;
    enabledSlashCommands?:boolean;
    renderInput?:(ctrl:ConversationUiCtrl)=>any;
    inputProps?:ConversationInputProps;
    theme?:ConvoLangTheme|'dark'|'light';
    showSource?:boolean;
    sourceMode?:ConvoEditorMode;
}

export function ConversationView({
    className,
    ctrl:ctrlProp,
    enabledSlashCommands,
    renderInput,
    inputProps,
    theme:_theme='light',
    sourceMode,
    showSource:_showSource,
}:ConversationViewProps){

    const ctxCtrl=useContext(ConversationUiContext);
    const defaultCtrl=ctrlProp??ctxCtrl;
    const ctrl=useMemo(()=>defaultCtrl??new ConversationUiCtrl(),[defaultCtrl]);

    useEffect(()=>{
        if(enabledSlashCommands!==undefined){
            ctrl.enabledSlashCommands=enabledSlashCommands;
        }
    },[ctrl,enabledSlashCommands]);

    const themeValue=useShallowCompareItem(_theme);
    useEffect(()=>{
        if(themeValue!==undefined){
            let t=themeValue;
            if(typeof t === 'string'){
                t=t==='dark'?defaultDarkConvoLangTheme:defaultLightConvoLangTheme;
            }
            ctrl.theme=t;
        }
    },[themeValue,ctrl]);

    const theme=useSubject(ctrl.themeSubject);

    const showSourceCtrl=useSubject(ctrl.showSourceSubject);
    const showSource=_showSource??showSourceCtrl;

    return (

        <ConversationUiContext.Provider value={ctrl}>

            <div className={style.root(null,className)} style={style.vars(theme)}>

                {showSource?
                    <MessagesSourceView mode={sourceMode} ctrl={ctrl} />
                :
                    <MessagesView ctrl={ctrl} />
                }

                {!showSource && (renderInput?renderInput(ctrl):<ConversationInput ctrl={ctrl} {...inputProps} />)}

            </div>
        </ConversationUiContext.Provider>
    )

}

const style=atDotCss({name:'ConversationView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        flex:1;
        position:relative;
    }
`});
