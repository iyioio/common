import { markdownLinesToString } from "./markdown-lib";
import { parseMarkdown } from "./markdown-parser";
import { MarkdownOutputFormat, MarkdownOutputOptions, MarkdownParsingOptions } from "./markdown-types";

export const formatMarkdown=(markdown:string,format:MarkdownOutputFormat|MarkdownOutputOptions,mdParseOptions?:MarkdownParsingOptions):string=>{
    const md=parseMarkdown(markdown,mdParseOptions);
    if(!md.result){
        return '';
    }
    return markdownLinesToString(format,md.result);
}
