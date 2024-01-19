import { markdownLinesToString } from "./markdown-lib";
import { parseMarkdown } from "./markdown-parser";
import { MarkdownOutputFormat, MarkdownOutputOptions } from "./markdown-types";

export const formatMarkdown=(markdown:string,format:MarkdownOutputFormat|MarkdownOutputOptions):string=>{
    const md=parseMarkdown(markdown);
    if(!md.result){
        return '';
    }
    return markdownLinesToString(format,md.result);
}
