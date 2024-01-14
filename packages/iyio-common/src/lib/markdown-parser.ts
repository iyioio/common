import { getCodeParsingError } from "./code-parsing";
import { CodeParser } from "./code-parsing-types";
import { MarkdownLine, MarkdownNode, MarkdownParsingOptions, MarkdownParsingResult, MarkdownTag } from "./markdown-types";
import { isValidEmail } from "./validation";

const mdReg=/([\n\r]*)([ \t]*)([^\n\r$]*)/g;

const headerReg=/(#+)\s*(.*)/;
const blockQuoteReg=/(>+)\s*(.*)/;
const ulReg=/([*+-])[ \t]*(.*)/;
const olReg=/([0-9]+)\.[ \t]*(.*)/;
const hrReg=/(\*{3,}|-{3,}|\+{3,})(.*)/;
const codeReg=/```[ \t]*(\S*)(.*)```([^\r\n]*)/gs;
const tagReg=/@([\w-]+)[ \t]*(.*)/g;


export const parseMarkdown:CodeParser<MarkdownLine[],MarkdownParsingOptions>=(
    code:string,
    {
        startIndex=0,
        startLine=1,
        parseTags,
    }:MarkdownParsingOptions={}
):MarkdownParsingResult=>{

    const lines:MarkdownLine[]=[];
    let error:string|undefined;
    let index=startIndex;
    let lineNumber=startLine;
    let capturedTags:MarkdownTag[]|undefined;


    const length=code.length;
    parsingLoop: while(index<length){


        mdReg.lastIndex=index;
        const match=mdReg.exec(code);
        if(!match){
            break;
        }
        const nl=match[1] as string;
        for(let lni=0;lni<nl.length;lni++){
            if(nl[lni]==='\n'){
                lineNumber++;
            }

        }

        let text=match[3]?.trimEnd();

        if(!text){
            if(text===undefined){
                error='text match failed'
                break parsingLoop;
            }
            index=match.index+match[0].length;
            continue;
        }

        const indent=match[2] as string;
        index=match.index+(match[1] as string).length+indent.length;

        const line:MarkdownLine={
            type:'p',
            ln:lineNumber,
        }

        if(indent.length){
            line.indent=0;
            let sp=0;
            for(let i=0;i<indent.length;i++){
                const c=indent[i];
                if(c===' '){
                    sp++;
                }else{
                    line.indent++;
                }

            }
            line.indent+=Math.ceil(sp/2);
        }

        if(text[0]==='>'){
            const lineMatch=blockQuoteReg.exec(text);
            if(!lineMatch){
                error='block quote match failed';
                break parsingLoop;
            }
            line.blockQuoteLevel=lineMatch[1]?.length;
            text=lineMatch[2];
            if(text===undefined){
                error='Block quote ending content match index error';
                break parsingLoop;
            }
        }

        switch(text[0]){

            case '#':{
                line.type='header';
                const lineMatch=headerReg.exec(text);
                if(!lineMatch){
                    error='header match failed';
                    break parsingLoop;
                }
                line.headerLevel=lineMatch[1]?.length;
                text=lineMatch[2];
                break;
            }

            case '*':
            case '+':
            case '-':{
                const hrMatch=hrReg.exec(text);
                if(hrMatch){//hr
                    line.type='hr';
                    text=hrMatch[1];
                }else{
                    line.type='list-item';
                    line.ulType=text[0];
                    const lineMatch=ulReg.exec(text);
                    if(!lineMatch){
                        error='unordered list match failed';
                        break parsingLoop;
                    }
                    text=lineMatch[2];
                }
                break;
            }

            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':{
                const lineMatch=olReg.exec(text);
                if(!lineMatch){
                    break;
                }
                line.type='list-item';
                line.listOrder=Number(lineMatch[1]);
                text=lineMatch[2];
                break;
            }

            case '\\':
                text=text.substring(1);
                break;

            case '`':{
                codeReg.lastIndex=index;
                const codeMatch=codeReg.exec(code);
                if(!codeMatch){
                    break;
                }
                line.type='code-block';
                line.codeLanguage=codeMatch[1];
                line.text=codeMatch[2]?.trim();
                if(line.text===undefined){
                    error='code block match code failed';
                    break parsingLoop;
                }
                const fullText=codeMatch[0];
                for(let lni=0;lni<fullText.length;lni++){
                    if(fullText[lni]==='\n'){
                        lineNumber++;
                    }
                }
                line.eln=lineNumber;
                text=codeMatch[3] as string;
                lines.push(line);
                index=codeMatch.index+fullText.length-text.length;
                continue parsingLoop;
            }

            case '@':{
                if(!parseTags){
                    break;
                }
                tagReg.lastIndex=index;
                const tagMatch=tagReg.exec(code);
                if(!tagMatch){
                    break;
                }
                if(!capturedTags){
                    capturedTags=[];
                }
                const v=tagMatch[2]?.trim();
                if(v){
                    capturedTags.push({
                        name:tagMatch[1]??'',
                        value:v
                    })
                }else{
                    capturedTags.push({
                        name:tagMatch[1]??'',
                    })
                }
                index=tagMatch.index+tagMatch[0].length;
                continue parsingLoop;
            }

        }

        if(text===undefined){
            error=`remaining line text match invalid index. line type = ${line.type??'default'}`;
            break parsingLoop;
        }

        if(capturedTags){
            line.tags=capturedTags;
            capturedTags=undefined;
        }

        const inline=parseInline(text);
        if(typeof inline === 'string'){
            line.text=inline;
        }else{
            mergeNodes(inline);
            line.nodes=inline;
        }

        const prev=lines[lines.length-1];
        if( prev &&
            line.type==='p' &&
            prev.type==='p' &&
            (line.ln-1===prev.ln || line.ln-1===prev.eln) &&
            prev.indent===line.indent &&
            prev.blockQuoteLevel===line.blockQuoteLevel &&
            !line.tags
        ){

            if(line.text!==undefined && prev.text!==undefined){
                prev.text+='\n'+line.text;
            }else{
                if(!prev.nodes){
                    prev.nodes=[];
                }
                if(prev.text!==undefined){
                    prev.nodes.push({text:prev.text});
                    delete prev.text;
                }
                if(!line.nodes){
                    line.nodes=[];
                }
                if(line.text!==undefined){
                    line.nodes.push({text:line.text})
                }

                prev.nodes.push({text:'\n'});
                prev.nodes.push(...line.nodes);
                mergeNodes(prev.nodes);

            }

            prev.eln=line.ln;

        }else{

            lines.push(line);
        }


        index=match.index+match[0].length;

    }


    if(error){
        return {
            error:getCodeParsingError(code,index,error),
            endIndex:index,

        }
    }else{
        return {
            result:lines,
            endIndex:index,

        }
    }
}

const unescapeReg=/\\([\\`*_{}[\]<>()#+\-.!|])/g;

const startReg=/([^\\])([*_`<![])/g;
const underscoreReg=/_((?:\\_|[^_])*)_/g;
const codeInlineReg=/`((?:\\`|[^`])*)`/g;
const starReg=/\*((?:\\\*|[^*])*)\*/g;
const addressReg=/<((?:\\>|[^>])*)>/g;
const linkReg=/\[((?:\\\]|[^\]])*)\][ \t]*\(((?:\\\)|[^)])*)\)/g;
const imageLinkReg=/\[[ \t]*![ \t]*\[((?:\\\]|[^\]])*)\][ \t]*\(((?:\\\)|[^)])*)\)[ \t]*\][ \t]*\(((?:\\\)|[^)])*)\)/g;

const parseInline=(text:string):string|MarkdownNode[]=>{

    startReg.lastIndex=0;
    let match=startReg.exec(text);
    if(!match){
        return unescapeMd(text);
    }

    const nodes:MarkdownNode[]=[];

    let index=0;
    do{

        const matchIndex=match.index+(match[1] as string).length;
        if(matchIndex!==index){
            const plain=text.substring(index,matchIndex);
            nodes.push({text:plain})
        }
        index=match.index+(match[1]?.length??0);
        let char=match[2]??'';
        let bold=false;
        let isImage=false;
        if((char==='_' || char==='*') && char===text[index+1]){
            bold=true;
            index++;
        }else if(char==='!'){
            isImage=true;
            index++;
            char=text[index]??'';
        }

        switch(char){

            case '_':
            case '*':{
                const reg=char==='_'?underscoreReg:starReg;
                reg.lastIndex=index;
                match=reg.exec(text);
                if(match){
                    const sub=parseInline(match[1]??'');
                    let subNodes:MarkdownNode[];
                    if(typeof sub === 'string'){
                        subNodes=[{text:sub}];
                    }else{
                        subNodes=sub;
                    }
                    for(const node of subNodes){
                        nodes.push(node);
                        if(bold){
                            node.bold=true;
                        }else{
                            node.italic=true;
                        }
                    }
                    index=match.index+match[0].length;
                    if(text[index]===char){
                        index++;
                    }
                }else{
                    nodes.push({text:char})
                    index++;
                }
                break;
            }

            case '`':
            case '<':{
                const isCode=char==='`'
                const reg=isCode?codeInlineReg:addressReg;
                reg.lastIndex=index;
                match=reg.exec(text);
                if(match){
                    const sub=parseInline(match[1]??'');
                    let subNodes:MarkdownNode[];
                    if(typeof sub === 'string'){
                        subNodes=[{text:sub}];
                    }else{
                        subNodes=sub;
                    }
                    for(const node of subNodes){
                        nodes.push(node);
                        if(isCode){
                            node.code=true;
                        }else{
                            if(node.text && isValidEmail(node.text)){
                                node.email=true;
                            }else if(!node.url && node.text){
                                node.url=node.text.trim();
                            }
                        }
                    }
                    index=match.index+match[0].length;
                }else{
                    nodes.push({text:char})
                    index++;
                }
                break;
            }

            case '[':{
                linkReg.lastIndex=index;
                match=linkReg.exec(text);
                if(match){
                    const matchValue=match[1]??'';
                    if(!isImage && matchValue.includes('!')){
                        imageLinkReg.lastIndex=index;
                        const liMatch=imageLinkReg.exec(text);
                        if(liMatch){
                            const sub=parseInline(liMatch[1]??'');
                            let subNodes:MarkdownNode[];
                            if(typeof sub === 'string'){
                                subNodes=[{text:sub.trim()}];
                            }else{
                                subNodes=sub;
                            }
                            const imageUrl=(liMatch[2]??'').trim();
                            const url=(liMatch[3]??'').trim();
                            for(const node of subNodes){
                                nodes.push(node);
                                node.url=url;
                                node.imageUrl=imageUrl;
                                node.link=true;
                            }
                            index=liMatch.index+liMatch[0].length;
                            break;
                        }
                    }
                    const sub=parseInline(matchValue);
                    let subNodes:MarkdownNode[];
                    if(typeof sub === 'string'){
                        subNodes=[{text:sub.trim()}];
                    }else{
                        subNodes=sub;
                    }
                    const url=(match[2]??'').trim();
                    for(const node of subNodes){
                        nodes.push(node);
                        if(isImage){
                            node.imageUrl=url;
                        }else{
                            node.url=url;
                            node.link=true;
                        }
                    }
                    index=match.index+match[0].length;
                }else{
                    nodes.push({text:char})
                    index++;
                }
                break;
            }


            default:
                nodes.push({text:isImage?'!'+char:char})
                index++;
                break;


        }


        startReg.lastIndex=index;
        match=startReg.exec(text);

    }while(match);

    if(index<text.length){
        nodes.push({text:text.substring(index)})
    }

    return nodes;
}

const unescapeMd=(text:string):string=>{
    return text.replace(unescapeReg,(_,c:string)=>c);
}

const mergeNodes=(nodes:MarkdownNode[])=>{
    let prev:MarkdownNode|undefined;
    let prevCanMarge=false;
    for(let i=0;i<nodes.length;i++){
        const node=nodes[i];
        if(!node){continue}

        const canMerge=(
            node.text &&
            !node.url &&
            !node.imageUrl &&
            !node.link &&
            !node.email &&
            !node.code
        )?true:false;

        if( canMerge &&
            prevCanMarge &&
            prev &&
            prev.bold===node.bold &&
            prev.italic===node.italic
        ){
            if(!prev.text){
                prev.text='';
            }
            prev.text+=node.text;
            nodes.splice(i,1);
            i--;
            continue;
        }

        prev=node;
        prevCanMarge=canMerge;
    }
}
