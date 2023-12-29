import { ConversationUiCtrl } from "./ConversationUiCtrl";
import { FlatConvoMessage } from "./convo-types";

export const convoPromptImagePropKey=Symbol('convoPromptImagePropKey');

export type ConvoEditorMode='code'|'vars';

export interface ConvoPromptImage
{
    url?:string;
    getUrl?:()=>string;
    [convoPromptImagePropKey]?:()=>string;
}

export interface ConvoDataStore
{
    loadConvo?(id:string):string|undefined|Promise<string|undefined>;

    saveConvo?(id:string,convo:string):void|Promise<void>;

    deleteConvo?(id:string):void|Promise<void>;
}


/**
 * null - use default renderer
 * undefined - use default renderer
 * false - do not render message
 */
export type ConvoMessageRenderResult=RenderedConvoMessage|null|undefined|false;
/**
 * Used to return a convo message.
 */
export type ConvoMessageRenderer=(message:FlatConvoMessage,index:number,ctrl:ConversationUiCtrl)=>ConvoMessageRenderResult;

export type RenderedConvoMessagePosition='before'|'replace'|'after'
export interface RenderedConvoMessage
{
    role?:string;
    content?:string;
    component?:any;
    /**
     * @default 'replace'
     */
    position?:RenderedConvoMessagePosition;
}
