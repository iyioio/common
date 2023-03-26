export const getNodeDOMRect=(node:Node):DOMRect|null=>{
    if(node instanceof Element){
        return node.getBoundingClientRect();
    }else{
        const range=document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect();
    }
}
