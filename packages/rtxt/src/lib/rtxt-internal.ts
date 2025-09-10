import { RTxtTool, rTxtDocAtt, rTxtIgnoreAtt, rTxtLineIndexAtt, rTxtNodeAtt } from "./rtxt-types.js";

export const getTextNode=(elem:Node|null|undefined,last=false,requireSingleChild=true):Text|null=>{
    if(!elem || (elem.childNodes.length!==1 && requireSingleChild)){
        return null;
    }

    let child=last?elem.lastChild:elem.firstChild;
    while(child && (child instanceof Element) && child.getAttribute(rTxtIgnoreAtt)){
        if(last){
            child=child.previousSibling
        }else{
            child=child.nextSibling;
        }
    }
    if(!child){
        return null;
    }
    if(child instanceof Text){
        return child;
    }

    return getTextNode(child,last,requireSingleChild);
}


export const getDeepestElem=(elem:Element):Element=>{
    if(elem.childNodes.length!==1){
        return elem;
    }

    const child=elem.firstChild;
    if(!child || !(child instanceof Element)){
        return elem;
    }

    return getDeepestElem(child);
}

export const getNodeElem=(node:Node):Element|null=>{
    while(node){
        if(!node.parentElement || !node.parentNode){
            return null;
        }
        if(node.parentElement.getAttribute(rTxtLineIndexAtt) || node.parentElement.getAttribute(rTxtDocAtt))
        {
            return node instanceof Element?node:null;
        }
        node=node.parentNode;
    }
    return null;

}

export const hasForeignElems=(elem:Element):boolean=>{

    if(!elem.getAttribute(rTxtNodeAtt)){
        return true;
    }

    for(let i=0;i<elem.children.length;i++){
        const child=elem.children[i];
        if(!child){
            continue;
        }
        if(hasForeignElems(child)){
            return true;
        }
    }

    return false;
}

export interface ToolGrouping{
    tool:RTxtTool;
    elems:Element[];
}

export const getToolElem=(elems:Element[]):Element|undefined=>{
    return elems.find(e=>!(e instanceof HTMLLabelElement));
}
