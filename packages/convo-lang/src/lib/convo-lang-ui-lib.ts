import { parseXml } from "@iyio/common";
import { ConvoMessageComponent, ConvoPromptImage, convoPromptImagePropKey } from "./convo-lang-ui-types";

export const getConvoPromptImageUrl=(img:string|ConvoPromptImage|null|undefined):string|undefined=>{
    if(typeof img === 'string'){
        return img
    }

    if(!img){
        return undefined;
    }

    return img.url??img.getUrl?.()??img[convoPromptImagePropKey]?.();
}

export const parseConvoMessageComponents=(content:string):ConvoMessageComponent[]|undefined=>{
    return parseXml(content).result;
}
