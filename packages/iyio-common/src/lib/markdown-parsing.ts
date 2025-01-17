import { MarkdownImageParsingItem } from "./markdown-types";

const imageReg=/!\[([^\]]*)\]\(([^\)]*)\)/gs;
const imageProtoReg=/!\[([^\]]*)\]\((\w+:\/\/.*?|data:\w+\/\w+;\w+,[^\)]*)\)/gs;

export const containsMarkdownImage=(content:string):boolean=>{
    const r=imageReg.test(content);
    imageReg.lastIndex=0;
    return r;
}

export interface ParseMarkdownImagesOptions
{
    noTrim?:boolean;
    requireImgProtocol?:boolean;
}

export const parseMarkdownImages=(
    content:string,
    {
        noTrim,
        requireImgProtocol=false,
    }:ParseMarkdownImagesOptions={}
):MarkdownImageParsingItem[]=>{
    const items:MarkdownImageParsingItem[]=[];


    let match:RegExpMatchArray|null;
    let i=0;
    const reg=requireImgProtocol?imageProtoReg:imageReg;
    while(match=reg.exec(content)){
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

export const objectToMarkdown=(obj:any,tab='',maxDepth=10,out:string[]=[]):string=>{
    _objectToMarkdown(obj,tab,'',maxDepth,out,true);
    return out.join('')
}

export const objectToMarkdownBuffer=(obj:any,out:string[],tab='',maxDepth=10):void=>{
    _objectToMarkdown(obj,tab,'',maxDepth,out,true);
}

const _objectToMarkdown=(obj:any,tab:string,prefix:string,maxDepth:number,out:string[],skipNewlineSeparator:boolean):void=>{
    if(tab){
        out.push(tab);
    }
    if(prefix){
        out.push(prefix);
        tab+='  ';
    }

    if(maxDepth<=0){
        return;
    }
    maxDepth--;
    if(obj===null){
        out.push('null');
        return;
    }else if(obj===undefined){
        out.push('undefined');
        return;
    }
    switch(typeof obj){

        case 'object':
            if(out.length && !skipNewlineSeparator){
                out.push('\n');
            }
            if(Array.isArray(obj)){
                let allObjects=true;
                for(let i=0;i<obj.length;i++){
                    const v=obj[i];
                    if((typeof v !== 'object') && v!=='undefined'){
                        allObjects=false;
                        break;
                    }
                }
                for(let i=0;i<obj.length;i++){
                    if(i){
                        out.push('\n');
                    }
                    _objectToMarkdown(obj[i],tab,allObjects?`${i+1}. `:'- ',maxDepth,out,false);
                }
            }else{
                let first=true;
                for(const e in obj){
                    if(first){
                        first=false;
                    }else{
                        out.push('\n');
                    }
                    _objectToMarkdown(obj[e],tab,`- ${e}: `,maxDepth,out,false);
                }
            }
            return;

        case 'string':
            break;

        default:
            obj=(obj?.toString?.()??'undefined');

    }

    if(typeof obj!=='string'){
        return;
    }else if(obj.includes('\n')){
        const parts=obj.split('\n');
        for(let i=0;i<parts.length;i++){
            if(i){
                out.push('\n');
                out.push(tab);
            }
            out.push(parts[i]??'');
        }
    }else{
        out.push(obj);
    }


}
