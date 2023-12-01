import { MarkdownImageParsingItem } from "./markdown-types";

const imageReg=/!\[(.*?)\]\((.*?)\)/gs;

export const containsMarkdownImage=(content:string):boolean=>{
    const r=imageReg.test(content);
    imageReg.lastIndex=0;
    return r;
}

export interface ParseMarkdownImagesOptions
{
    noTrim?:boolean;
}

export const parseMarkdownImages=(
    content:string,
    {
        noTrim
    }:ParseMarkdownImagesOptions={}
):MarkdownImageParsingItem[]=>{
    const items:MarkdownImageParsingItem[]=[];


    let match:RegExpMatchArray|null;
    let i=0;
    while(match=imageReg.exec(content)){
        if(match.index===undefined){
            break;
        }
        let text=content.substring(i,match.index);
        if(!noTrim){
            text=text.trim();
        }
        if(text.length){
            items.push({text});
        }

        const desc=match[1]?.trim();
        items.push({
            image:{
                url:match[2]??'',
                description:desc||undefined,
            }
        });

        i=match.index+match[0].length;

    }

    if(i<content.length){
        let text=content.substring(i);
        if(!noTrim){
            text=text.trim();
        }
        if(text.length){
            items.push({text});
        }
    }

    return items;
}
