import { aryRemoveAll, aryShallowUnorderedCompare, deepClone, getObjKeyCount, isDomNodeDescendantOf } from "@iyio/common";
import { RTxtAlignment, RTxtDescriptor, RTxtDoc, RTxtDocAndLookup, RTxtDomSelection, RTxtLine, RTxtNode, RTxtSelection, defaultRTxtNodeType, rTxtAttPrefix, rTxtIgnoreAtt, rTxtIndexLookupAtt, rTxtLineAlignAtt, rTxtLineIndexAtt, rTxtTypeAtt } from "./rtxt-types.js";

export const getRTxtSelection=(
    domSelection:RTxtDomSelection,
    lookup:RTxtNode[],
    rootElem?:HTMLElement|null
):RTxtSelection|null=>{

    if(!domSelection.anchorNode || !domSelection.focusNode){
        return null;
    }

    let startNode=findRTxtNode(domSelection.anchorNode,lookup,rootElem);
    if(!startNode){
        return null;
    }

    let endNode=findRTxtNode(domSelection.focusNode,lookup,rootElem);
    if(!endNode){
        return null;
    }

    let startIndex=lookup.indexOf(startNode);
    let endIndex=lookup.indexOf(endNode);
    let startOffset=domSelection.anchorOffset;
    let endOffset=domSelection.focusOffset;

    const cursorIndex=endIndex;

    if(startIndex>endIndex || (startIndex===endIndex && startOffset>endOffset)){

        let tmpN=endIndex;
        endIndex=startIndex;
        startIndex=tmpN;

        tmpN=endOffset;
        endOffset=startOffset;
        startOffset=tmpN;

        const tmpNode=endNode;
        endNode=startNode;
        startNode=tmpNode;
    }

    const nodes:RTxtNode[]=lookup.slice(startIndex,endIndex+1);


    return {
        nodes,
        startNode,
        startIndex,
        startOffset,
        endNode,
        endIndex,
        endOffset,
        cursorIndex,
        cursorNode:lookup[cursorIndex],
    }
}

export const selectRTxtSelection=(selection:RTxtSelection,docElem:Element):boolean=>{

    const startElem=docElem.querySelector(`[${rTxtIndexLookupAtt}='${selection.startIndex}']`);

    if(!startElem){
        return false;
    }

    const endElem=docElem.querySelector(`[${rTxtIndexLookupAtt}='${selection.endIndex}']`)??startElem;

    const sel=globalThis.window?.getSelection();
    if(!sel){
        return false;
    }

    sel.removeAllRanges();
    const range=new Range();
    range.setStart(startElem,selection.startOffset);
    range.setEnd(endElem,selection.endOffset);
    sel.addRange(range);
    return true;
}

export const findRTxtNode=(
    domNode:Node,
    lookup:RTxtNode[],
    rootElem?:HTMLElement|null
):RTxtNode|null=>{

    let dn:Node|null=domNode;

    if(dn.nodeType===Node.TEXT_NODE){
        dn=domNode.parentNode;
    }

    while(dn){
        if((dn instanceof HTMLElement) && (rootElem?isDomNodeDescendantOf(dn,rootElem,true):true)){
            const index=dn.getAttribute(rTxtIndexLookupAtt);
            if(index){
                return lookup[Number(index)]??null;
            }
        }

        dn=dn.parentNode;
    }

    return null;
}

export const rTxtSelectionToString=(selection:RTxtSelection,lookup:RTxtNode[]):string=>{

    if(selection.startIndex===selection.endIndex){
        if(typeof selection.startNode.v !== 'string'){
            return '';
        }
        return selection.startNode.v.substring(selection.startOffset,selection.endOffset);
    }

    const buffer:string[]=[];
    for(let i=selection.startIndex;i<=selection.endIndex;i++){
        const node=lookup[i];
        if(typeof node?.v !== 'string'){
            continue;
        }
        if(i===selection.startIndex){
            buffer.push(node.v.substring(selection.startOffset));
        }else if(i===selection.endIndex){
            buffer.push(node.v.substring(0,selection.endOffset))
        }else{
            buffer.push(node.v);
        }
    }

    return buffer.join('');
}

/**
 * Converts each character in the doc into it's own node. This is used when when in editing mode.
 * @returns true if the doc was modified
 */
export const convertRTxtDocToSingleCharNodes=(doc:RTxtDoc):boolean=>{
    let changed=false;
    for(let i=0;i<doc.lines.length;i++){
        let line=doc.lines[i];
        if(!line){
            continue;
        }
        if(Array.isArray(line)){
            line={nodes:line}
            doc.lines[i]=line;
        }
        const nodes=line.nodes;
        for(let i=0;i<nodes.length;i++){
            const node=nodes[i];
            if(!node?.v || (node.v?.length??0)<=1){
                continue;
            }
            changed=true;
            nodes.splice(i,1);
            const chars=Array.from(node.v);
            for(const char of chars){
                const clone=deepClone(node);
                clone.v=char;
                nodes.splice(i,0,clone);
                i++;
            }
            i--;

        }
    }
    return changed;
}

export const minifyRTxtDoc=(doc:RTxtDoc):RTxtDoc=>{

    const destDoc:RTxtDoc={lines:[]};

    for(const lineOrNodes of doc.lines){

        const srcNodes=getRTxtLineNodes(lineOrNodes);
        const srcLine=Array.isArray(lineOrNodes)?undefined:lineOrNodes;
        const destNodes:RTxtNode[]=[];

        if(srcNodes.length>0){
            let currentNode:RTxtNode=deepClone(srcNodes[0]??{});
            let currentTypes=getRTxtNodeNormalizedTypes(currentNode);
            destNodes.push(currentNode);
            for(let i=1;i<srcNodes.length;i++){
                const srcNode=srcNodes[i];
                if(!srcNode){
                    continue;
                }

                const srcTypes=getRTxtNodeNormalizedTypes(srcNode);

                if(aryShallowUnorderedCompare(currentTypes,srcTypes)){
                    currentNode.v=(currentNode.v??'')+(srcNode.v??'');
                }else{
                    currentNode=deepClone(srcNode);
                    currentTypes=srcTypes;
                    destNodes.push(currentNode);
                }
            }
        }

        if(srcLine && getObjKeyCount(srcLine)>1){
            let destLine:RTxtLine={...srcLine};
            delete (destLine as any).nodes;
            destLine=deepClone(destLine);
            (destLine as any).nodes=destNodes;
            destDoc.lines.push(destLine);
        }else{
            destDoc.lines.push(destNodes);
        }

    }


    return destDoc;
}

export const getRTxtNodeNormalizedTypes=(node:RTxtNode):string[]=>{
    const types=node.t?(Array.isArray(node.t)?node.t:[node.t]):[];
    aryRemoveAll(types,defaultRTxtNodeType);
    return types;
}

export const sortRTxtNodeTypes=(node:RTxtNode,descriptors:Record<string,RTxtDescriptor>):void=>{
    if(!node.t || (typeof node.t === 'string')){
        return;
    }

    node.t.sort((a,b)=>(descriptors[a]?.priority??0)-(descriptors[b]?.priority??0));
}

export const elemToRTxtDoc=(docElem:Element):RTxtDocAndLookup=>{

    const doc:RTxtDoc={lines:[]}
    const lookup:RTxtNode[]=[];

    for(let i=0;i<docElem.children.length;i++){
        const lineElem=docElem.children.item(i);
        if(!lineElem || shouldIgnoreRTxtLineElem(lineElem)){
            continue;
        }

        const lineAtt=lineElem.getAttribute(rTxtLineIndexAtt);
        const children=lineAtt?lineElem.children:[lineElem];

        const alignAtt=lineElem.getAttribute(rTxtLineAlignAtt);
        const align=(alignAtt as RTxtAlignment|undefined)??((lineElem instanceof HTMLElement)?textAlignToRTxtAlignment(lineElem.style.textAlign):undefined);
        const line:RTxtLine={nodes:[]};
        if(align!=='start'){
            line.align=align;
        }
        doc.lines.push(line);

        for(let ni=0;ni<children.length;ni++){
            const nodeElem=children[ni];
            if(!nodeElem){
                continue;
            }

            const node=elemToRTxtNode(nodeElem);
            if(node){
                line.nodes.push(node);
                lookup.push(node);
            }

        }
    }

    return {doc,lookup};
}

export const textAlignToRTxtAlignment=(align:string|null|undefined):RTxtAlignment|undefined=>{
    if(!align){
        return undefined;
    }
    switch(align){
        case 'left':return 'start';
        case 'center':return 'center';
        case 'right':return 'end';
        default: return undefined;
    }
}

export const elemToRTxtNode=(nodeElem:Element):RTxtNode|null=>{

    const value=nodeElem.textContent;
    if(!value){
        return null;
    }

    const type=nodeElem.getAttribute(rTxtTypeAtt);

    let atts:Record<string,string>|undefined=undefined;

    for(let i=0;i<nodeElem.attributes.length;i++){
        const att=nodeElem.attributes.item(i);
        if(!att || !att.name.startsWith(rTxtAttPrefix)){
            continue;
        }
        if(!atts){
            atts={}
        }
        atts[att.name.substring(rTxtAttPrefix.length)]=att.value;
    }

    const t=type?(type.includes(',')?type.split(','):type):undefined;

    const node:RTxtNode={v:value};

    if(t && t!==defaultRTxtNodeType){
        node.t=t;
    }
    if(atts){
        node.atts=atts;
    }

    return node;
}

export const getRTxtNodesTypes=(nodes:RTxtNode[]|null|undefined):string[]=>{
    const types:string[]=[];
    if(!nodes){
        return types;
    }

    for(const node of nodes){
        if(!node.t){
            continue;
        }
        if(typeof node.t === 'string'){
            if(!types.includes(node.t)){
                types.push(node.t);
            }
        }else{
            for(const type of node.t){
                if(!types.includes(type)){
                    types.push(type);
                }
            }
        }
    }

    return types;
}

export const getRTxtLineNodes=(lineOrNodes:RTxtLine|RTxtNode[]):RTxtNode[]=>{
    if(Array.isArray(lineOrNodes)){
        return lineOrNodes;
    }else{
        return lineOrNodes.nodes??[];
    }
}

export const getRTxtNodeLine=(doc:RTxtDoc,node:RTxtNode):RTxtLine|undefined=>{
    const line=doc.lines.find(l=>Array.isArray(l)?false:l.nodes.includes(node));
    return line as RTxtLine|undefined;
}


export const getRTxtNodesLines=(doc:RTxtDoc,nodes:RTxtNode[]):RTxtLine[]=>{
    const lines:RTxtLine[]=[];
    for(const node of nodes){
        const line=getRTxtNodeLine(doc,node);
        if(line && !lines.includes(line)){
            lines.push(line);
        }
    }
    return lines;
}

export const shouldIgnoreRTxtLineElem=(node:Node|null|undefined):boolean=>{
    if(!node){
        return true;
    }

    if(((node instanceof Element) && node.getAttribute(rTxtIgnoreAtt)) || (node instanceof HTMLBRElement)){
        return true;
    }else{
        return false;
    }
}

export const isRTxtDocEmpty=(doc:RTxtDoc|null|undefined):boolean=>{
    if(!doc?.lines?.length){
        return true;
    }

    for(const line of doc.lines){
        if(Array.isArray(line)){
            if(line.length){
                return false;
            }
        }else if(line.nodes.length){
            return false;
        }
    }

    return true;

}
