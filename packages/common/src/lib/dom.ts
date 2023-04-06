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
