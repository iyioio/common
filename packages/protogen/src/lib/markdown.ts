import { protoAddChild, protoCreateEmptyNode, protoCreateNodeAddressMap, protoEnsureUniqueAddress, protoNormalizeNodes, ProtoNormalizeNodesOptions } from "./protogen-node";
import { ProtoNode, ProtoNodeRenderData, ProtoParsingResult, ProtoTypeInfo } from "./protogen-types";

const lineReg=/^([ \t]*)(#+|-)[ \t]+(\$?\w[\w-]*)(\??)(:)?[ \t]*(.*)(?=\n|$)/;
const lineRegSpace=1;
const lineRegMarkdownType=2;
const lineRegName=3;
const lineRegOptional=4;
const lineCol=5;
const lineRegRest=6;

const codeReg=/[ \t]*```/;

const hrReg=/(^|\n)-{2,}[ \t]*/;

const spaceStartReg=/^([ \t]+)/;
const spaceStartRegIndex=1;

export const protoMarkdownGetIndent=(value:string)=>spaceStartReg.exec(value)?.[spaceStartRegIndex]??''


export const protoMarkdownParseNodes=(code:string,options?:ProtoNormalizeNodesOptions):ProtoParsingResult=>{

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
        const depth=getDepth(protoMarkdownGetIndent(line),'');
        const value=line.replace(/[ \t]*(#+|-)?[ \t]*/,'').trim();

        if( lastNode &&
            lastNode.isContent &&
            lastNode.renderData
        ){
            const indent=lastNode.renderData.indent??'';
            if(indent && line.startsWith(indent)){
                line=line.substring(indent.length);
            }
            lastNode.renderData.input+='\n'+(line?lastNode.renderData.indent:'')+line;
            lastNode.value+='\n'+(protoMarkdownGetIndent(line))+value;
            return;
        }

        const content=protoCreateEmptyNode('#','',value);
        allNodes.push(content);
        content.renderData={
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
            if(match && (match[lineCol] || match[lineRegMarkdownType]?.startsWith('#'))){

                const mdType=match[lineRegMarkdownType]??'';
                const depth=getDepth(match[lineRegSpace]??'',mdType);
                const parent=nodeStack[depth-1];

                const name=match[lineRegName]??'';
                let value=match[lineRegRest]??'';
                const {types,tags}=parseTypesAndFlags(rootNodes[rootNodes.length-1]??null,value);
                if(value.startsWith('!!')){
                    value=value.substring(2).trim();
                }
                const node:ProtoNode={
                    name,
                    address:name,
                    type:types[0]?.type??'',
                    types,
                    value:getNodeValue(value),
                    renderData:{
                        input:line,
                        depth,
                    }
                }
                if(value.includes('=')){
                    node.valueEq=true;
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
                        const {tags}=parseTypesAndFlags(rootNodes[rootNodes.length-1]??null,line);
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
                            name:subMatch[2]?.trim()??'',
                            address:subMatch[3]?.trim()??'',
                        })
                    }
                }
            }
        }

    }

    const addressMap=protoCreateNodeAddressMap(allNodes);

    protoNormalizeNodes(allNodes,{...(options??{}),addressMap});

    return {rootNodes,allNodes,addressMap};

}

const getNodeValue=(content:string)=>{
    const ei=content.indexOf('=');
    if(ei!==-1){
        return content.substring(ei+1).trim();
    }else{
        return content.replace(/\(\w+\)/g,'').trim();
    }
}

const parseTypesAndFlags=(rootNode:ProtoNode|null,value:string):{
    types:ProtoTypeInfo[],
    tags?:string[],
}=>{

    const matches=value.startsWith('!!')?[]:value.matchAll(/([@>#~*?!= \t]+)?(\(?)[ \t]*([\w.\-[\]]+)(\)?)/g);
    const flagsI=1;
    const tagOpenI=2;
    const nameI=3;
    const tagCloseI=4;


    const types:ProtoTypeInfo[]=[];
    let tags:string[]|undefined;

    for(const match of matches){

        const nameMatch=match[nameI]??'';

        if(match[tagOpenI]){
            if(!match[tagCloseI]){
                continue;
            }
            if(!tags){
                tags=[];
            }
            if(!tags.includes(nameMatch)){
                tags.push(nameMatch)
            }

            continue;
        }

        const path=nameMatch.split('.');
        const isArray=/\[\s*\]/.test(path[0]??'');
        const mapTypeMatch=/\[\s*(\w+)\s*\]/.exec(path[0]??'');
        for(let i=0;i<path.length;i++){
            if(path[i]?.includes('[')){
                path[i]=path[i]?.replace(/\[[\s\w]*]/g,'')??'';
            }
        }

        if(!path[0] && rootNode){
            path[0]=rootNode.name;
        }
        const name=path[0]??'';
        const flags:string|undefined=match[flagsI];
        const eqType=flags?.includes('=');

        const type:ProtoTypeInfo={
            type:eqType?(types[0]?.type??''):name,
            isRefType:eqType?false:/[A-Z]/.test(name.charAt(0)),
            path,
        }
        if(eqType){
            type.equals=true;
        }
        types.push(type);
        if(isArray){
            type.isArray=true;
        }
        if(mapTypeMatch?.[1]){
            type.mapType=mapTypeMatch[1];
        }
        if(flags){
            if(flags.includes('*')){
                type.important=true;
            }
            if(flags.includes('>')){
                type.source=true;
            }
            if(flags.includes('@')){
                type.copySource=true;
            }
            if(flags.includes('!')){
                type.ex=true;
            }
            if(flags.includes('?')){
                type.question=true;
            }
            if(flags.includes('#')){
                type.hash=true;
            }
            if(flags.includes('~')){
                type.less=true;
            }
        }
        if(nameMatch.startsWith('.')){
            type.dot=true;
        }
        if(eqType){
            break;
        }
    }

    if(!types.length){
        types.push({type:'',path:[]})
    }

    return {types,tags};

}

const getDepth=(space:string,markdownType:string):number=>{
    return (Math.floor(space.length/2))+(markdownType.startsWith('#')?0:1)
}


export const protoMarkdownRenderer=(
    node:ProtoNode,
    renderData:ProtoNodeRenderData
):ProtoNodeRenderData=>{

    const input=`- ${node.name}${node.value?': '+node.value:''}`;

    return {
        ...renderData,
        input
    }
}

export const removeProtoMarkdownBaseIndent=(md:string):string=>{
    const lines=md.split('\n');
    let indent:string|null=null;
    for(let i=0;i<lines.length;i++){
        const line=lines[i];
        if(!line){
            continue;
        }
        if(indent===null){
            if(!line.trim()){
                continue;
            }
            indent=/^(\s*)/.exec(line)?.[1]??''
        }
        if(line.startsWith(indent)){
            lines[i]=line.substring(indent.length);
        }
    }
    return lines.join('\n').trim();
}
