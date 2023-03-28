import { HashMap } from "@iyio/common";
import { getMultiProtoAttValue, setProtoLayout } from "./protogen-lib";
import { NodeAndPropName, ProtoAttribute, ProtoLayout, ProtoNode, ProtoPosScale, ProtoTypeInfo, ProtoViewMode } from "./protogen-types";

export interface ProtogenMarkdownNode
{
    name:string;
    x:number;
    y:number;
    width:number;
    code:string;
}

export const markdownHidden='*hidden*'


export const splitMarkdown=(code:string)=>{
    return code.split(/(?=(^|\n)##\s)/g).map(c=>c.trim()).filter(c=>c);
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
    hiddenCode?:string,
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
    const visibleLength=lines.length;
    if(hiddenCode){
        lines.push(markdownHidden);
        const hiddenLines=hiddenCode.split('\n');
        for(const l of hiddenLines){
            lines.push(l);
        }
    }
    let views:any[]=[];

    const setLayout=(node:ProtoNode)=>{
        if(node.name.startsWith('$')){
            return;
        }
        const layout=getLayout?.(views);
        if(layout){
            layout.typeNode=typeNode??undefined;
            layout.node=node;
        }
        setProtoLayout(node,layout??null);
    }

    for(let lineIndex=0;lineIndex<lines.length;lineIndex++){
        const line=lines[lineIndex];
        views=[];
        if(viewPointer && lineIndex<visibleLength){
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
        if(match=/^(\s*)-\s+([$\w]+)(\?)?\s*(:(.*)|\s*)$/.exec(line)){// bullet
            const depth=getDepth(match[1]);
            const name=match[2];
            const optional=match[3]?true:false;
            const value=match[5]?.trim()??'';
            if(depth===0){
                lastAtt=null;
                const types=parseTypes(value);
                propNode={
                    name,
                    type:types[0]?.type??'',
                    isArray:types[0]?.isArray??false,
                    refType:types[1],
                    types,
                    optional,
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

        }else if(match=/^\s*##\s+([\w:\s]+)*/.exec(line)){// header
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
        }else if(line.includes(markdownHidden)){// hidden
            hidden=true
        }else{
            const lastNode=propNode??typeNode;
            if(lastNode){
                lastNode.comment=(
                    (lastNode.comment??'')+
                    (lastNode.comment?'\n':'')+
                    (propNode?(
                        (line.startsWith('  - ') || line.startsWith('    '))?line.substring(4):line
                    ):(
                        (line.startsWith('- ') || line.startsWith('  '))?line.substring(2):line
                    ))
                )
            }
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

const layoutRegNoStart=/-\s+\$layout\s*:\s*([-\d.]+)\s+([-\d.]+)(\s+([-\d.]+))?/i
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
    if(code.includes(markdownHidden)){
        return code;
    }
    return code+'\n'+markdownHidden;
}

export const splitMarkdownSections=(code:string):string[]=>{
    const sections:string[]=[];
    let lastIndex=-1;
    const matches=code.matchAll(/(^|\n)\s*##\s+(\w+)/g);
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


export const addMarkdownAttribute=(
    code:string,
    childName:string,
    attName:string,
    value:string,
    hidden:boolean
):string=>{

    const matches=code.matchAll(/(^|\n)-\s+([$\w]+)\??\s*(:|$|\n|\r)/g);
    let match:RegExpMatchArray|null=null;
    for(const m of matches){
        if(m[2]===childName){
            match=m;
            if(!hidden){
                break;
            }
        }
    }

    const attLine=`  - ${attName}:${value?' '+value:''}`;
    const hiddenIndex=hidden?-1:code.indexOf(markdownHidden);

    if(!match || (hidden && (match.index??0)<hiddenIndex)){
        return `${hidden?addMarkdownHidden(code):code}\n- ${childName}\n${attLine}`
    }

    const insertAt=code.indexOf('\n',(match.index??0)+1);
    if(insertAt===-1){
        return `${hidden?addMarkdownHidden(code):code}\n- ${childName}\n${attLine}`
    }
    return `${code.substring(0,insertAt+1)}${attLine}\n${code.substring(insertAt+1)}`;
}



export const mergeMarkdownCode=(code:string,addCode:string,viewMode:ProtoViewMode):string=>{

    if(viewMode==='all'){
        return code;
    }

    let aHi=code.indexOf(markdownHidden);
    const bHi=addCode.indexOf(markdownHidden);

    if(viewMode==='children'){
        const lines=(aHi===-1?code:code.substring(0,aHi)).split('\n');
        const namedLines:{line:string,name:string|null}[]=[];
        for(const line of lines){
            const match=/^(-|##)\s+([$\w]+)\??\s*(:.*?$|$)/.exec(line);
            namedLines.push({
                line,
                name:match?.[2]??null
            })

        }

        const matches=(
            bHi===-1?addCode:addCode.substring(0,bHi).trim()
        ).matchAll(/(\n|^)(-|##)\s+([$\w]+)\??\s*(\n|:.*?\n)((?!-\s|##\s)(.|\n)*?)(?=(\n(-|##)\s))/g);
        for(const match of matches){
            const name=match[3];
            for(const line of namedLines){
                if(line.name===name){
                    line.line+='\n'+match[5];
                    break;
                }
            }

        }

        for(let i=0;i<namedLines.length;i++){
            lines[i]=namedLines[i].line;
        }
        code=lines.join('\n');

        aHi=code.indexOf(markdownHidden);

    }

    if(aHi===-1 && bHi!==-1){
        code=code.trim()+'\n\n'+addCode.substring(bHi);
    }

    return code;
}

export const applyMarkdownViewMode=(code:string,viewMode:ProtoViewMode):string=>{

    switch(viewMode){

        case 'atts':{
            const i=code.indexOf(markdownHidden);
            return i===-1?code:code.substring(0,i).trim();
        }

        case 'children':{
            const i=code.indexOf(markdownHidden);
            if(i!==-1){
                code=code.substring(0,i).trim();
            }
            return code.replace(/(^|\n)(?!-\s|##\s).*?(?=($|\n))/g,'');
        }

        default:
            return code;

    }
}


export const getHiddenMarkdownCode=(code:string,viewMode:ProtoViewMode)=>{

    if(viewMode==='all'){
        return '';
    }else if(viewMode==='atts'){
        return getHiddenMarkdownBlock(code);
    }

    return code.replace(/(^|\n)#.*?(\n|$)/g,'\n- $self');
}


export const getHiddenMarkdownBlock=(code:string)=>{
    const i=code.indexOf(markdownHidden);
    if(i===-1){
        return '';
    }
    const e=code.indexOf('\n',i);
    if(e===-1){
        return '';
    }
    return code.substring(e+1).trim();
}
