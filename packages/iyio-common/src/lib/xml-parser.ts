import { getCodeParsingError } from "./code-parsing.js";
import { CodeParser } from "./code-parsing-types.js";
import { getErrorMessage } from "./error-lib.js";
import { unescapeHtml } from "./html.js";
import { XmlNode, XmlParsingOptions, XmlParsingResult } from "./xml-parser-types.js";

const nextTagReg=/([^<]*)<\s*(\/?)\s*([^\s>/]*)/gs;
const attReg=/\s*(?:(\/?\s*>)|(\W+)|(?:([\w-]+)\s*(=?)\s*(?:(?:"([^"]*)")|(?:'([^']*)'))?))/gs;
const tagReg=/^\w+[\w-]*$/;

export const xmlTextNodeName='text';

export const parseXml:CodeParser<XmlNode[],XmlParsingOptions>=(
    xml:string,
    {
        startIndex=0,
        emptyAttValue,
        stopOnFirstNode,
        parseJsonAtts
    }:XmlParsingOptions={}
):XmlParsingResult=>{

    const rootNode:XmlNode={
        name:'',
        children:[]
    }
    const stack:XmlNode[]=[rootNode];
    let currentNode:XmlNode=rootNode;

    let inTag=false;
    let isClosingTag=false;
    let index=startIndex;
    let error:string|undefined;

    const length=xml.length;
    parsingLoop: while(index<length){

        if(inTag){

            attReg.lastIndex=index;
            const match=attReg.exec(xml);
            if(!match){
                error='End of tag not found';
                break parsingLoop;
            }

            const close=match[1];
            if(close){
                if(close[0]==='/' || isClosingTag){//self closing
                    stack.pop();
                    const n=stack[stack.length-1];
                    if(!n){
                        error='No nodes left on stack';
                        break parsingLoop;
                    }
                    currentNode=n;
                }
                inTag=false;
                isClosingTag=false;
                index=match.index+match[0].length;
                if(stack.length===1 && stopOnFirstNode){
                    break parsingLoop;
                }
                continue parsingLoop;
            }

            if(isClosingTag){
                error='Closing tags are not allowed to have attributes';
                break parsingLoop;
            }

            if(match[2]){
                error=`Invalid character(s) found in tag - ${match[2]}`;
                break parsingLoop;
            }

            const name=match[3]??'';
            const eq=match[4];
            const value=match[5]??match[6];

            if(!eq && value!==undefined){
                error=`Attribute ${name} is missing (=) character for value assignment`;
                break parsingLoop;
            }

            if(!currentNode.atts){
                currentNode.atts={};
            }

            if(parseJsonAtts && value && value.endsWith('}')){
                if(value.startsWith('\\{')){
                    currentNode.atts[name]=unescapeHtml(value.substring(1));
                }else if(value.startsWith('{')){
                    if(value==='{undefined}'){
                        currentNode.atts[name]=undefined;
                    }else{
                        try{
                            currentNode.atts[name]=JSON.parse(unescapeHtml(value.substring(1,value.length-1)));
                        }catch(ex){
                            error=`Parsing json attribute failed. att = ${name} - ${getErrorMessage(ex)}`;
                            break parsingLoop;
                        }
                    }
                }else{
                    currentNode.atts[name]=unescapeHtml(value);
                }
            }else{
                currentNode.atts[name]=value===undefined?(emptyAttValue??name):unescapeHtml(value);
            }

            index=match.index+match[0].length;

        }else{
            nextTagReg.lastIndex=index;
            const match=nextTagReg.exec(xml);
            if(!match){//end of input found
                const endText=xml.substring(index).trim();
                if(endText){
                    if(!currentNode.children){
                        currentNode.children=[];
                    }
                    currentNode.children.push({
                        name:xmlTextNodeName,
                        text:unescapeHtml(endText),
                    })
                }
                index=length;
                break parsingLoop;
            }
            const text=match[1]?.trim();

            if(text){
                if(!currentNode.children){
                    currentNode.children=[];
                }
                currentNode.children.push({
                    name:xmlTextNodeName,
                    text:unescapeHtml(text),
                })
            }


            const nameValue=match[3]??'';
            const nameMatch=tagReg.exec(nameValue);
            if(!nameMatch){
                error=`Invalid tag name - ${nameValue}`;
                break parsingLoop;
            }
            const name=nameMatch[0];
            isClosingTag=match[2]==='/';
            if(isClosingTag){
                if(currentNode.name!==name){
                    error=`Closing tag name mismatch. name = ${name}, found = ${currentNode.name}`;
                    break parsingLoop;
                }
            }else{
                const node:XmlNode={
                    name,
                }
                if(!currentNode.children){
                    currentNode.children=[];
                }
                currentNode.children.push(node);
                currentNode=node;
                stack.push(node);
            }
            inTag=true;
            index=match.index+match[0].length;
        }

    }

    if(error){
        return {
            error:getCodeParsingError(xml,index,error),
            endIndex:index,

        }
    }else{
        return {
            result:rootNode.children??[],
            endIndex:index,

        }
    }

}
