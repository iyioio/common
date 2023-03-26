import { HashMap } from "@iyio/common";
import { getMultiProtoAttValue, setProtoLayout } from "./protogen-lib";
import { NodeAndPropName, ProtoAttribute, ProtoLayout, ProtoNode, ProtoPosScale, ProtoTypeInfo } from "./protogen-types";

export interface Connection
{
    name:string;
    prop:number;
}

export interface ProtogenMarkdownNode
{
    name:string;
    x:number;
    y:number;
    width:number;
    code:string;
    connections?:Connection[];
}

const typeReg=/^\s*##\s*(\w+)/;
const layoutReg=/^\s*-\s+\$layout\s*:\s*([\d.]+)\s+([\d.]+)(\s+([\d.]+))?/;

export const parseProtogenMarkdownItem=(str:string):ProtogenMarkdownNode[]=>{

    const nodes:ProtogenMarkdownNode[]=[];

    let node:ProtogenMarkdownNode|null=null;
    let code:string[]=[];

    const lines=str.split('\n');

    for(let i=0;i<lines.length;i++){

        const line=lines[i];
        const typeMatch=typeReg.exec(line);
        if(typeMatch){
            if(node){
                node.code=code.join('\n');
                code=[];
                nodes.push(node);
            }
            node={
                name:typeMatch[0],
                x:0,
                y:0,
                width:300,
                code:''
            }
            code=[line];
        }else if(node){
            const layoutMatch=layoutReg.exec(line);
            if(layoutMatch){
                node.x=Number(layoutMatch[1]);
                node.y=Number(layoutMatch[2]);
                node.width=Number(layoutMatch[3]);
            }else{
                code.push(line);
            }
        }

    }

    if(node){
        node.code=code.join('\n');
        code=[];
        nodes.push(node);
    }

    return nodes;

}


const linkReg=/^\s*(\w+)\.?(\w+)?/i;
export const parseMarkdownLink=(line:string):NodeAndPropName|null=>{

    const match=linkReg.exec(line);
    if(!match){
        return null;
    }
    return {
        nodeName:match[1],
        propName:match[2],
    }
}

const getDepth=(space:string):number=>{
    return Math.floor(space.length/2);
}

export interface ViewCharPointer
{
    index:number;
    view:any;
    char:string;
    move(chars:number):void;
}

export const parseMarkdownNodes=(
    code:string,
    viewPointer?:ViewCharPointer,
    getLayout?:(views:any[])=>ProtoLayout|null
):ProtoNode[]=>{

    const nodes:ProtoNode[]=[];

    let typeNode:ProtoNode|null=null;
    let propNode:ProtoNode|null=null;
    let lastAtt:ProtoAttribute|null=null;
    let hidden=false;

    const pushTypeNode=()=>{
        if(typeNode){

            if(typeNode.children){
                const propMap:HashMap<ProtoNode>={}
                for(let i=0;i<typeNode.children.length;i++){
                    const child=typeNode.children[i];
                    const existing=propMap[child.name];
                    mergeNormalizeNodes(child,existing);
                    if(!existing){
                        propMap[child.name]=child;
                    }

                    if(existing || child.name.startsWith('$')){
                        typeNode.children.splice(i,1);
                        i--;
                    }
                }

                const self=propMap['$self'];
                if(self){
                    mergeNormalizeNodes(self,typeNode);
                }else{
                    mergeNormalizeNodes(typeNode,null);
                }
            }

            nodes.push(typeNode);
        }
        typeNode=null;
        propNode=null;
        lastAtt=null;
        hidden=false;
    }

    const lines=code.split('\n');
    let views:any[]=[];

    const setLayout=(node:ProtoNode)=>{
        if(node.name.startsWith('$')){
            return;
        }
        const layout=getLayout?.(views);
        if(layout){
            layout.node=node;
        }
        setProtoLayout(node,layout??null);
    }

    for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
        const line=lines[lineIndex];
        views=[];
        if(viewPointer){
            for(let ci=0;ci<line.length;ci++){
                if(viewPointer.char!==line.charAt(ci)){
                    throw new Error(
                        `viewPointer char does not match line char. lineChar=${
                        line.charAt(ci)}, vChar=${viewPointer.char}, line=${line}`
                    )
                }
                if(viewPointer.view && !views.includes(viewPointer.view)){
                    views.push(viewPointer.view);
                }
                viewPointer.move(1);
            }
            viewPointer.move(1);// move past newline
        }
        if(!line.trim()){
            continue;
        }

        let match:RegExpExecArray|null=null;
        if(match=/^(\s*)-\s*([$\w]+)\s*(\?)?\s*:?(.*)/.exec(line)){// bullet
            const name=match[2];
            const value=match[4]?.trim()??'';
            const depth=getDepth(match[1]);
            if(depth===0){
                lastAtt=null;
                const types=parseTypes(match[4]??'');
                propNode={
                    name,
                    type:types[0]?.type??'',
                    isArray:types[0]?.isArray??false,
                    refType:types[1],
                    types,
                    optional:match[3]?true:false,
                    attributes:{},
                    hidden,
                }
                setLayout(propNode);
                if(typeNode){
                    if(!typeNode.children){
                        typeNode.children=[];
                    }
                    typeNode.children.push(propNode);
                }
            }else if(depth===1){
                const att:ProtoAttribute={
                    name:name,
                    value:value,
                    props:{[name]:value}
                }
                lastAtt=att;
                const node=propNode??typeNode;
                if(node){
                    const xa=node.attributes[name];
                    if(xa){
                        if(!xa.multiValue){
                            xa.multiValue=[xa.value];
                        }
                        xa.multiValue.push(att.value);
                        lastAtt=xa;
                    }else{
                        node.attributes[name]=att;
                    }
                }
            }else{
                if(lastAtt){
                    lastAtt.props[name]=value;
                }
            }

        }else if(match=/^\s*#+\s*(\w+)*/.exec(line)){// header
            pushTypeNode();
            const types=parseTypes(match[1]);
            if(types.length){
                typeNode={
                    name:types[0].type,
                    ...types[0],
                    refType:types[1],
                    optional:false,
                    types,
                    attributes:{},
                    hidden,
                }
                setLayout(typeNode);
            }
        }else if(match=/^\s*[*_]hidden[*_]/i.exec(line)){// hidden
            hidden=true
        }
    }

    if(typeNode){
        pushTypeNode();
    }
    //console.info(nodes);
    return nodes;
}

const parseTypes=(line:string):ProtoTypeInfo[]=>{
    const parts=line.split(':');
    const types:ProtoTypeInfo[]=[];

    for(const p of parts){
        let type=p.trim();
        if(!type){
            continue;
        }
        if(type.endsWith('[]')){
            type=type.substring(0,type.length-2).trim();
            if(!type){
                continue;
            }
            types.push({type,isArray:true});
        }else{
            types.push({type,isArray:false})
        }
    }

    return types;
}

const layoutRegNoStart=/-\s+\$layout\s*:\s*([\d.]+)\s+([\d.]+)(\s+([\d.]+))?/i
export const getMarkdownProtoPos=(code:string):ProtoPosScale|null=>{
    const match=layoutRegNoStart.exec(code);
    if(!match){
        return null;
    }
    return {
        x:Number(match[1]),
        y:Number(match[2]),
        width:match[4]?Number(match[4]):300,
        scale:1,
    }
}

export const getMarkdownProtoPosStr=(pos:ProtoPosScale,noNewLine=false):string=>(
    `${noNewLine?'':'\n'}- $layout: ${Math.round(pos.x)} ${Math.round(pos.y)}${pos.width===undefined?'':` ${pos.width}`}`
)

export const setMarkdownProtoPos=(code:string,pos:ProtoPosScale):string=>{
    const match=layoutRegNoStart.exec(code);
    if(match){
        const i=code.indexOf('\n',match.index);
        return code.substring(0,match.index)+getMarkdownProtoPosStr(pos,true)+(i===-1?'':code.substring(i));
    }else{
        return addMarkdownHidden(code)+getMarkdownProtoPosStr(pos);
    }

}

export const addMarkdownHidden=(code:string):string=>{
    if(code.includes('*hidden*')){
        return code;
    }
    return code+'\n*hidden*';
}

export const splitMarkdownSections=(code:string):string[]=>{
    const sections:string[]=[];
    let lastIndex=-1;
    const matches=code.matchAll(/(^|\n)\s*##\s*(\w+)/g);
    for(const match of matches){

        if(lastIndex!==-1){
            const sec=code.substring(lastIndex,match.index).trim();
            if(sec){
                sections.push(sec);
            }
        }
        if(match.index===undefined){
            break;
        }
        lastIndex=match.index;
    }
    if(lastIndex!==-1){
        const sec=code.substring(lastIndex).trim();
            if(sec){
                sections.push(sec);
            }
    }
    return sections
}


const mergeNormalizeNodes=(child:ProtoNode,existing:ProtoNode|null|undefined)=>{
    if(existing){
        if(child.type){
            existing.type=child.type;
            existing.isArray=child.isArray;
        }
        const cAtts=child.attributes;
        for(const e in cAtts){
            const cAtt=cAtts[e];
            const xAtts=existing.attributes;
            const xAtt=xAtts[e];
            if(xAtt){
                if(!xAtt.multiValue){
                    xAtt.multiValue=[xAtt.value];
                }
                if(cAtt.multiValue){
                    xAtt.multiValue.push(...cAtt.multiValue);
                }else{
                    xAtt.multiValue.push(cAtt.value);
                }
                for(const p in cAtt.props){
                    xAtt.name=cAtt.name;
                    xAtt.value=cAtt.value||xAtt.value;
                    xAtt.props[p]=(
                        cAtt.props[p]||xAtts[e].props[p]
                    )
                }
            }else{
                xAtts[e]=cAtt;
            }
        }
    }

    const apply=existing??child;
    const links=getMultiProtoAttValue(apply.attributes['$link']);

    for(const link of links){
        const v=parseMarkdownLink(link);
        if(v){
            if(!apply.links){
                apply.links=[];
            }
            apply.links.push(v);
        }
    }
}
