import { protoAddChild, protoCreateEmptyNode, protoCreateNodeAddressMap, protoEnsureUniqueAddress, protoNormalizeNodes } from "./protogen-node";
import { ProtoAddressMap, ProtoTypeInfo, _ProtoNode as ProtoNode } from "./protogen-types";

const lineReg=/^([ \t]*)(#+|-)[ \t]+(\$?\w+)(\??)[ \t]*:?[ \t]*(.*)(?=\n|$)/;
const lineRegSpace=1;
const lineRegMarkdownType=2;
const lineRegName=3;
const lineRegOptional=4;
const lineRegRest=5;

const codeReg=/[ \t]*```/;

const hrReg=/(^|\n)-{2,}[ \t]*/;

const spaceStartReg=/^([ \t]+)/;
const spaceStartRegIndex=1;

const getIndent=(value:string)=>spaceStartReg.exec(value)?.[spaceStartRegIndex]??''

export interface ParseMdNodesResult
{
    rootNodes:ProtoNode[];
    allNodes:ProtoNode[];
    addressMap:ProtoAddressMap;
}

export const protoMarkdownParseNodes=(code:string):ParseMdNodesResult=>{

    const rootNodes:ProtoNode[]=[];
    const allNodes:ProtoNode[]=[];
    let nodeStack:{[depth:number]:ProtoNode}={}
    let currentNode:ProtoNode|null=null;
    let lastNode:ProtoNode|null=null;
    let inCode=false;

    const reset=()=>{
        currentNode=null;
        lastNode=null;
        nodeStack={};
    }

    const lines=code.split('\n');

    const pushRootNode=(node:ProtoNode)=>{

        protoEnsureUniqueAddress(node,rootNodes);

        rootNodes.push(node);
    }

    const addContent=(line:string)=>{
        const depth=getDepth(getIndent(line),'');
        const value=line.replace(/[ \t]*(#+|-)?[ \t]*/,'').trim();

        if( lastNode &&
            lastNode.isContent &&
            lastNode.parserMetadata
        ){
            const indent=lastNode.parserMetadata.indent??'';
            if(indent && line.startsWith(indent)){
                line=line.substring(indent.length);
            }
            lastNode.parserMetadata.input+='\n'+(line?lastNode.parserMetadata.indent:'')+line;
            lastNode.value+='\n'+(getIndent(line))+value;
            return;
        }

        const content=protoCreateEmptyNode('#','',value);
        allNodes.push(content);
        content.parserMetadata={
            indent:/^([ \t]+)/.exec(line)?.[1]??'',
            input:line,
            depth,
        };
        content.isContent=true;
        if(currentNode?.contentFocused){
            content.importantContent=true;
        }
        if(currentNode){
            protoAddChild(currentNode,content);
        }else{
            pushRootNode(content);
        }
        lastNode=content;
    }

    for(const _line of lines){
        const line=_line.trimEnd();

        if(inCode){
            addContent(line);
            if(codeReg.test(line)){
                inCode=false;
            }
        }else{
            const match=lineReg.exec(line);
            if(match){

                const mdType=match[lineRegMarkdownType];
                const depth=getDepth(match[lineRegSpace],mdType);
                const parent=nodeStack[depth-1];

                const name=match[lineRegName];
                const value=match[lineRegRest];
                const {types,tags}=parseTypesAndFlags(value);
                const node:ProtoNode={
                    name,
                    address:name,
                    ...types[0],
                    types,
                    value,
                    parserMetadata:{
                        input:line,
                        depth,
                    }
                }
                allNodes.push(node);
                if(parent?.contentFocused){
                    node.importantContent=true;
                }
                if(match[lineRegOptional]){
                    node.optional=true;
                }
                if(types[1]){
                    node.refType=types[1];
                }
                if(tags){
                    node.tags=tags;
                }
                if(mdType==='######' && node.name.startsWith('$')){
                    node.contentFocused=true;
                }
                if(name.startsWith('$')){
                    node.special=true;
                }

                if(parent){
                    protoAddChild(parent,node);
                }else{
                    pushRootNode(node);
                }

                nodeStack[depth]=node;
                currentNode=node;
                lastNode=node;


            }else{// add content
                if(hrReg.test(line)){
                    reset();
                }
                addContent(line);
                if(codeReg.test(line)){
                    inCode=true;
                }else if(currentNode){

                    let subMatch:RegExpMatchArray|null;

                    // check for tags
                    if(/^[ \t]*-[ \t]+\([ \t]*(\w+)[ \t]*\)/.test(line)){
                        const {tags}=parseTypesAndFlags(line);
                        if(tags){
                            for(const t of tags){
                                if(!currentNode.tags){
                                    currentNode.tags=[];
                                }
                                if(!currentNode.tags.includes(t)){
                                    currentNode.tags.push(t);
                                }
                            }
                        }
                    // check of links
                    }else if(subMatch=/^([ \t]*|[ \t]*-[ \t]+)\[([^[]+)\]\(([^)]+)\)/.exec(line)){
                        if(!currentNode.links){
                            currentNode.links=[];
                        }
                        currentNode.links.push({
                            name:subMatch[2].trim(),
                            address:subMatch[3].trim()
                        })
                    }
                }
            }
        }

    }

    const addressMap=protoCreateNodeAddressMap(allNodes);

    protoNormalizeNodes(allNodes,{addressMap});

    return {rootNodes,allNodes,addressMap};

}

const parseTypesAndFlags=(value:string):{types:ProtoTypeInfo[],tags?:string[]}=>{

    const matches=value.matchAll(/(\(?)[ \t]*(\w+)[ \t]*(\)?)(\[[ \t]*\])?[ \t]*([*? \t])?/g);

    const types:ProtoTypeInfo[]=[];
    let tags:string[]|undefined;

    for(const match of matches){

        if(match[1]){
            if(!match[3]){
                continue;
            }
            if(!tags){
                tags=[];
            }
            if(!tags.includes(match[2])){
                tags.push(match[2])
            }

            continue;
        }

        const type:ProtoTypeInfo={
            type:match[2]
        }
        types.push(type);
        if(match[4]){
            type.isArray=true;
        }
        const flags=match[5];
        if(flags){
            for(const f of flags){
                if(!/\s/.test(f)){
                    if(!type.flags){
                        type.flags=[];
                    }
                    if(!type.flags.includes(f)){
                        type.flags.push(f);
                    }
                }
            }
        }
    }

    if(!types.length){
        types.push({type:''})
    }

    return {types,tags};

}

const getDepth=(space:string,markdownType:string):number=>{
    return (Math.floor(space.length/2))+(markdownType.startsWith('#')?0:1)
}

export const protoMarkdownSplitCode=(code:string):string[]=>{
    return code.split(hrReg)
}


export const protoMarkdownRenderLines=(
    nodes:ProtoNode[],
    maxDepth?:number,
    filter?:(node:ProtoNode)=>boolean
):string[]=>{

    const lines:string[]=[];

    for(const node of nodes){

        if(!node.parserMetadata){
            continue;
        }

        if(!node.importantContent && maxDepth!==undefined && (maxDepth<(node.parserMetadata.depth??0) || !node.parserMetadata.input)){
            continue;
        }

        if(filter && !filter(node)){
            continue;
        }
        lines.push(node.parserMetadata.input??'');
    }

    return lines;

}
