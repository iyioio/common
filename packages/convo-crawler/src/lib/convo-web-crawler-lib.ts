import { escapeConvoMessageContent } from "@iyio/convo-lang";
import { ConvoPageCaptureActionItem } from "./convo-web-crawler-types";

export const defaultConvoWebCrawlOptionsMaxDepth=2;
export const defaultConvoWebCrawlOptionsMaxConcurrent=3;
export const defaultConvoWebCrawlOptionsResultLimit=3;
export const defaultConvoWebSearchOptionsMaxConcurrent=3;

export const convoWebActionItemToMdLink=(link:ConvoPageCaptureActionItem):string=>{
    return `[${escapeConvoMessageContent(link.text,false,{removeNewLines:true})}](${escapeConvoMessageContent(link.href??'#',false,{removeNewLines:true})})`
}
