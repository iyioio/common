import { Statement } from 'estree-jsx';
import { parse as parseJson } from 'json5';
import { MdxUiAtt, MdxUiDeconstructProp, MdxUiNode, MdxUiSelection, MdxUiSelectionItem, MdxUiSourceCodeRef, MdxUiSourceMap, MdxUiSrcStartEnd } from "./mdx-ui-builder-types";

export const defaultMdxUiClassNamePrefix='mdx-ui-builder-node-';

export const mdxUiDragDropIdAtt='data-mdx-ui-drop-id';

export const defaultMdxUidDeconstructProps:(string|MdxUiDeconstructProp)[]=[
    {
        name:'comp',
        default:'{}',
    },
    'hookCtrl'
]

export const areMdxUiSelectionEqual=(a:MdxUiSelection|null|undefined,b:MdxUiSelection|null|undefined):boolean=>{
    if(!a || !b){
        return !a && !b;
    }

    if(a.all.length!==b.all.length){
        return false;
    }

    for(let i=0;i<a.all.length;i++){
        const item=a.all[i];
        if(!item){
            if(b.all[i]){
                return false;
            }
            continue;
        }
        if(item.id!==b.all[i]?.id){
            return false;
        }
    }

    return true;
}

export const mergeMdxUiSelection=(a:MdxUiSelection,b:MdxUiSelection):MdxUiSelection=>{
    const all=[...a.all];
    for(const item of b.all){
        if(!all.some(i=>i.id===item.id)){
            all.push(item);
        }
    }
    return {
        item:all[0] as MdxUiSelectionItem,
        all,
    }
}

export const getMdxUiTextPosition=(node:MdxUiNode):MdxUiSrcStartEnd|undefined=>
{
    const start=getStartPos(node);
    const end=getEndPos(node);
    if(!start || !end){
        return undefined;
    }
    return {
        start:start.start,
        end:end.end
    }
}

const getStartPos=(node:MdxUiNode):MdxUiSrcStartEnd|undefined=>
{
    if(node.type==='text' && node.position){
        return node.position;
    }
    if(!node.children){
        return undefined;
    }

    for(let i=0;i<node.children.length;i++){
        const c=node.children[i];
        if(!c){continue}
        const pos=getStartPos(c);
        if(pos){
            return pos;
        }
    }

    return undefined;
}
const getEndPos=(node:MdxUiNode):MdxUiSrcStartEnd|undefined=>
{
    if(node.type==='text' && node.position){
        return node.position;
    }
    if(!node.children){
        return undefined;
    }

    for(let i=node.children.length-1;i>=0;i--){
        const c=node.children[i];
        if(!c){continue}
        const pos=getStartPos(c);
        if(pos){
            return pos;
        }
    }

    return undefined;
}

export const isMdxUiNodeTextEditableById=(id:string,sourceMap:MdxUiSourceMap):boolean=>{
    return sourceMap.metadata[id]?.textEditable?true:false;
}

const editableJsxElementTypes=["p","span","strong","a","em","i","b","strike","ul","ol","li","h1","h2","h3","h4","h5","h6","td","th"];
export const defaultAllowedMdxUiTextEditableAttNames=['className','class','style'];
export const defaultAllowedMdxUiTextEditableObjectAttNames=['style'];
/**
 * Checks if a node should be allowed to by text editable. For a node to be text editable it should
 * not have any dynamic expressions.
 *
 * Rules for being editable
 * - must be one of the following
 *   - type is "text" or:
 *   - type is "element" and:
 *     - all children are text editable
 *   - type is "mdxJsxTextElement" and:
 *     - name is in "p","span","strong","a","em","i","b","strike","ul","ol","li","h1","h2","h3","h4","h5","h6","td","th"
 *     - only has a style property and className property
 *     - className property must dont define an estree, value is a string
 *     - style attribute has a type of "mdxJsxAttributeValueExpression"
 *       - body.length must be 1
 *       - body[0].expression.type must be "ObjectExpression"
 *       - keys must be Identifiers or Literals
 *       - values must be Literals
 */
export const isMdxUiNodeTextEditable=(node:MdxUiNode|null|undefined):boolean=>{
    if(!node){
        return false;
    }else if(node.type==='text'){
        return true;
    }else if(
        node.type==='element' ||
        (node.type==='mdxJsxTextElement' && editableJsxElementTypes.includes(node.name))
    ){
        if(node.attributes){
            for(const att of node.attributes){
                if(!isMdxUiTextEditableAttribute(att)){
                    return false;
                }
            }
        }
        if(node.children){
            for(const child of node.children){
                if(!isMdxUiNodeTextEditable(child)){
                    return false;
                }
            }
        }
        return true;
    }else{
        return false;
    }

}

export const isMdxUiTextEditableAttribute=(
    att:MdxUiAtt,
    allowedAttNames:string[]|null=defaultAllowedMdxUiTextEditableAttNames,
    allowedObjectAtts:string[]|null=defaultAllowedMdxUiTextEditableObjectAttNames
):boolean=>{

    if(allowedAttNames && !allowedAttNames.includes(att.name)){
        return false;
    }

    if((typeof att.value === 'string') || att.value===undefined){
        return true;
    }

    if(allowedObjectAtts && !allowedObjectAtts.includes(att.name)){
        return false;
    }

    const tree=att.value?.data?.estree;

    if(!tree || (typeof tree !== 'object')){
        return false;
    }

    return isMdxUiEsTreeObjectLiteral(tree.body?.[0])
}

export const isMdxUiEsTreeObjectLiteral=(expression:Statement):boolean=>{
    if(expression.type!=='ExpressionStatement'){
        return false;
    }
    const obj=expression.expression;
    if(obj.type!=='ObjectExpression'){
        return false;
    }

    for(const prop of obj.properties){
        if( prop.type!=='Property' ||
            !(prop.key.type==='Identifier' || prop.key.type==='Literal') ||
            prop.value.type!=='Literal'
        ){
            return false;
        }
    }

    return true;

}

export const getMdxUiPrefixClassName=(elem:Element,prefix:string):string|undefined=>{
    for(let i=0;i<elem.classList.length;i++){
        const c=elem.classList.item(i);
        if(c?.startsWith(prefix)){
            return c;
        }
    }
    return undefined;
}

export const removeMdxUiPrefixClassName=(elem:Element,prefix:string):boolean=>{
    let removed=false;
    for(let i=0;i<elem.classList.length;i++){
        const c=elem.classList.item(i);
        if(c?.startsWith(prefix)){
            elem.classList.remove(c);
            i--;
            removed=true;
        }
    }
    return removed;
}

export const mdxUiDynamicAttributeValue=Symbol('mdxUiDynamicAttributeValue');

export const mdxUiAttsToObject=(atts:MdxUiAtt[],skipDynamic=false):Record<string,any>=>{
    const obj:Record<string,any>={};

    for(const att of atts){
        const value=att.sourceValue??att.value;
        if(value?.data?.estree){
            const statement:Statement=value.data.estree.body[0];
            if(statement?.type==="ExpressionStatement" && statement.expression.type==="Literal"){
                try{
                    obj[att.name]=parseJson(value.value);
                }catch{
                    if(!skipDynamic){
                        obj[att.name]=mdxUiDynamicAttributeValue;
                    }
                }
            }else{
                if(!skipDynamic){
                    obj[att.name]=mdxUiDynamicAttributeValue;
                }
            }
        }else if(value===null || value===undefined){
            obj[att.name]=true;
        }else{
            obj[att.name]=value;
        }
    }

    return obj;
}

export const isMdxUiNodeOpen=(node:MdxUiNode,src:MdxUiSourceCodeRef):boolean=>{
    if(node.type!=="mdxJsxFlowElement" || !node.position){
        return false;
    }

    const chunk=src.src.substring(node.position.start.offset,node.position.end.offset)
    return /^\s*<\w+/.test(chunk) && /<\/\w+>\s*$/.test(chunk);

}

export const getMdxUiNodeText=(node:MdxUiNode):string=>{
    let text='';
    if(!node.children){
        return text;
    }

    for(const c of node.children){
        if(c.type==='text' && (typeof c.value === 'string')){
            text+=(text?'\n\n':'')+c.value;
        }
    }
    return text;
}
