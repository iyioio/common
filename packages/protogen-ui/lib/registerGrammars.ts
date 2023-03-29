import hljs from "highlight.js";
import { pMarkdown } from "./protogen-grammar";

let registered=false;

export const registerGrammars=()=>{
    if(registered){
        return;
    }
    registered=true;

    hljs.registerLanguage('p-markdown',pMarkdown);
}
