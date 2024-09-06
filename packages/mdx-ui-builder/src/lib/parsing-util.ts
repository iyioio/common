import { deepClone } from "@iyio/common";
import { compile } from "@mdx-js/mdx";
import { MdxUiAtt, MdxUiNode } from "./mdx-ui-builder-types";

const cache:Record<string,MdxUiNode>={};

const getTemplate=(template:string)=>{

    const match=cache[template];
    if(match){
        return match;
    }

    let div:MdxUiNode|undefined;

    compile(template,{
        rehypePlugins:[()=>{

            return (tree:MdxUiNode,file,next)=>{
                div=tree.children?.[0];
                next();
            }
        }]
    })

    if(!div){
        throw new Error('Unable to get complied div in createWrapperTemplate')
    }

    cache[template]=div;

    return div;
}


export const getWrapper=(elem:string,className:string)=>{
    const wrapper=deepClone(getTemplate(
        `<div className={(props.className||'')+"CLASS_NAME"}></div>`
    ),200);
    wrapper.name=elem;
    const right=(wrapper as any).attributes[0].value.data.estree.body[0].expression.right;
    const nameJson=JSON.stringify(className);
    right.raw=nameJson
    right.value=className;
    (wrapper as any).attributes[0].value.value=`(props.className||'')+${nameJson}`;

    return wrapper;
}


export const wrapClassName=(att:MdxUiAtt,className:string)=>{
    const wrapper=deepClone(getTemplate(
        `<div className={["EXISTING","CLASS_NAME"].join(' ')}></div>`
    ),200);

    const attValue=(wrapper as any).attributes[0].value
    const elements=attValue.data.estree.body[0].expression.callee.object.elements;

    elements[0]=deepClone(att.value?.data.estree.body[0].expression,200);
    const nameJson=JSON.stringify(className);
    elements[1].raw=nameJson;
    elements[1].value=className;

    att.value=attValue;

}
