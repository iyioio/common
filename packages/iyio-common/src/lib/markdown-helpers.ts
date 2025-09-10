import { markdownLinesToString } from "./markdown-lib.js";
import { parseMarkdown } from "./markdown-parser.js";
import { MarkdownOutputFormat, MarkdownOutputOptions, MarkdownParsingOptions } from "./markdown-types.js";

export const formatMarkdown=(markdown:string,format:MarkdownOutputFormat|MarkdownOutputOptions,mdParseOptions?:MarkdownParsingOptions):string=>{
    const md=parseMarkdown(markdown,mdParseOptions);
    if(!md.result){
        return '';
    }
    return markdownLinesToString(format,md.result);
}
