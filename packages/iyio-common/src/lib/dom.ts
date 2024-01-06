export const getNodeDOMRect=(node:Node):DOMRect|null=>{
    if(node instanceof Element){
        return node.getBoundingClientRect();
    }else{
        const range=document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect();
    }
}

export const isDomNodeDescendantOf=(child:Node|null|undefined,parent:Node|null|undefined,checkChildIsParent:boolean):boolean=>{
    if(!parent || !child){
        return false;
    }
    if(checkChildIsParent && child===parent){
        return true;
    }

    child=child.parentNode;

    while(child){

        if(child===parent){
            return true;
        }

        child=child.parentNode;
    }

    return false;
}

export const hasClassName=(node:Node|null|undefined,className:string,checkDescendants?:boolean):boolean=>{
    if(!node){
        return false;
    }

    if((node instanceof Element) && node.classList.contains(className)){
        return true;
    }

    if(!checkDescendants){
        return false;
    }

    node=node.parentNode;

    while(node){

        if((node instanceof Element) && node.classList.contains(className)){
            return true;
        }

        node=node.parentNode;
    }
    return false;
}


export const getElementOrDescendantByClassName=(node:Node|null|undefined,className:string):Element|null=>{
    if(!node){
        return null;
    }

    if((node instanceof Element) && node.classList.contains(className)){
        return node;
    }

    node=node.parentNode;

    while(node){

        if((node instanceof Element) && node.classList.contains(className)){
            return node;
        }

        node=node.parentNode;
    }
    return null;
}
