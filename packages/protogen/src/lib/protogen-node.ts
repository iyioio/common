import { deleteUndefined, getSubstringCount, Point, safeParseNumber } from "@iyio/common";
import { protoSetLayout } from "./protogen-lib";
import { ProtoAddressMap, ProtoChildren, ProtoLayout, ProtoLink, ProtoNode, ProtoNodeRenderData, ProtoParsingResult, ProtoPosScale, ProtoTypeInfo } from "./protogen-types";

const parentKey=Symbol('ProtoNodeParent');

export const protoAddChild=(parent:ProtoNode,child:ProtoNode)=>{

    if(!parent.children){
        parent.children={};
    }

    let name=child.name;
    if(name in parent.children){
        if(name==='#'){
            name='';
        }
        let i=2;
        while((name+'#'+i) in parent.children){
            i++;
        }
        name+='#'+i;
    }
    child.address=parent.address+'.'+name;
    parent.children[name]=child;
    (child as any)[parentKey]=parent;

}

export const protoFindChild=(
    parent:ProtoNode|null|undefined,
    recursive:boolean,
    filter:(child:ProtoNode,key:string,parent:ProtoNode)=>boolean
):ProtoNode|undefined=>{

    if(!parent?.children){
        return undefined;
    }

    for(const key in parent.children){
        const child=parent.children[key];
        if(filter(child,key,parent)){
            return child;
        }
        if(recursive){
            const found=protoFindChild(child,true,filter);
            if(found){
                return found;
            }
        }
    }
    return undefined;
}

export const protoFindChildren=(
    parent:ProtoNode|null|undefined,
    recursive:boolean,
    filter:(child:ProtoNode,key:string,parent:ProtoNode)=>boolean,
    appendTo?:ProtoNode[]
):ProtoNode[]=>{
    const children:ProtoNode[]=appendTo??[];
    if(!parent){
        return children;
    }
    _protoFindChildren(parent,recursive,filter,children);
    return children;
}

const _protoFindChildren=(
    parent:ProtoNode,
    recursive:boolean,
    filter:(child:ProtoNode,key:string,parent:ProtoNode)=>boolean,
    children:ProtoNode[]
)=>{

    if(!parent.children){
        return;
    }

    for(const key in parent.children){
        const child=parent.children[key];
        if(filter(child,key,parent)){
            children.push(child);
        }
        if(recursive){
            _protoFindChildren(child,true,filter,children);
        }
    }
}

export const protoGetChildren=(
    parent:ProtoNode|null|undefined,
    recursive:boolean,
    appendTo?:ProtoNode[]
):ProtoNode[]=>{
    const children:ProtoNode[]=appendTo??[];
    if(!parent){
        return children;
    }
    _protoGetChildren(parent,recursive,children);
    return children;
}

const _protoGetChildren=(
    parent:ProtoNode,
    recursive:boolean,
    children:ProtoNode[]
)=>{

    if(!parent.children){
        return;
    }

    for(const key in parent.children){
        const child=parent.children[key];
        children.push(child);
        if(recursive){
            _protoGetChildren(child,true,children);
        }
    }
}


export const protoGetChildrenByName=(
    parent:ProtoNode|null|undefined,
    name:string,
    recursive:boolean,
    appendTo?:ProtoNode[]
):ProtoNode[]=>{
    return protoFindChildren(parent,recursive,c=>c.name===name,appendTo);
}

export const protoGetNodeParent=(node:ProtoNode|null|undefined):ProtoNode|undefined=>(node as any)?.[parentKey];

export const protoApplyParent=(node:ProtoNode)=>{
    if(!node.children){
        return;
    }

    for(const name in node.children){

        const child=node.children[name];
        if(!child){
            continue;
        }
        (child as any)[parentKey]=node;

        protoApplyParent(child);

    }
}

export const protoCreateEmptyNode=(name:string,type:string,value?:string):ProtoNode=>{

    const node:ProtoNode={
        name,
        address:name,
        type,
        types:[{type,path:[]}]
    }
    if(value!==undefined){
        node.value=value;
    }
    return node;
}

export const protoCreateNodeAddressMap=(nodes:ProtoNode[]):ProtoAddressMap=>{
    const map:ProtoAddressMap={}
    for(const n of nodes){
        map[n.address]=n;
    }
    return map;
}


export const protoEnsureUniqueAddress=(node:ProtoNode,nodes:ProtoNode[]):boolean=>{

    const hasMatch=(address:string)=>{
        for(const n of nodes){
            if(n.address===address){
                return true;
            }
        }
        return false;
    }



    if(!hasMatch(node.address)){
        return false;
    }

    const h=node.address.lastIndexOf('#');
    const d=node.address.lastIndexOf('.');
    const address=h>d?node.address.substring(0,h):node.address;

    let i=2;
    while(hasMatch(address+'#'+i)){
        i++;
    }

    node.address=address+'#'+i;

    return true;
}

/**
 * Merges all nodes from srcNodes into destNodes
 * @param destNodes A flat map of nodes
 * @param srcNodes A flat map of nodes
 */
export const protoMergeNodes=(destNodes:ProtoNode[],srcNodes:ProtoNode[])=>
{
    const destMap=protoCreateNodeAddressMap(destNodes);

    const added:ProtoNode[]=[];

    for(const srcNode of srcNodes){

        if(destMap[srcNode.address]){
            continue;
        }
        destMap[srcNode.address]=srcNode;
        added.push(srcNode);

    }

    for(const node of added){

        let i=node.address.lastIndexOf('.');
        let pa=i===-1?null:node.address.substring(0,i);
        const parent:ProtoNode|undefined=pa?destMap[pa]:undefined;
        if(parent && !added.includes(parent)){
            protoAddChild(parent,node);
        }

        if(node.renderData?.before){
            const before=destMap[node.renderData.before];
            const bi=destNodes.indexOf(before);
            if(before && bi!==-1){
                destNodes.splice(bi+1,0,node);
                continue;
            }
        }


        if(parent && pa){
            i=destNodes.indexOf(parent);
            if(i===-1){
                destNodes.push(node);
                continue;
            }
            i++;
            pa+='.';
            while(destNodes[i]?.address.startsWith(pa)){
                i++;
            }
            destNodes.splice(i+1,0,node);
        }else{
            if(node.renderData && !node.renderData.before){
                destNodes.unshift(node);
            }else{
                destNodes.push(node);
            }
        }
    }


    protoNormalizeNodes(destNodes,{addressMap:destMap});

}


export interface ProtoNormalizeNodesOptions
{
    autoLink?:boolean;
    revLink?:boolean;
    updateBefore?:boolean;
    addressMap?:ProtoAddressMap;
    srcLink?:boolean;
    addComments?:boolean;
}

export const protoNormalizeNodes=(nodes:ProtoNode[],{
    autoLink=true,
    revLink=true,
    srcLink=true,
    updateBefore=true,
    addComments=true,
    addressMap=protoCreateNodeAddressMap(nodes),
}:ProtoNormalizeNodesOptions={})=>{

    let lastNode=null;
    for(const node of nodes){

        if(addComments && node.children?.['#']){
            node.comment=(node.children['#'].value??'').trimEnd();
        }

        const parent=protoGetNodeParent(node);

        for(const type of node.types){
            if(type.source){
                const address=type.path.join('.');
                node.sourceAddress=address;
                node.sourceLinked=addressMap[address]?true:false;
                protoAddLink(node,{
                    name:address,
                    address,
                    priority:'med',
                    src:true,
                })
            }
            if(type.copySource){
                node.copySource=true;
            }
        }

        if(updateBefore && node.renderData && lastNode){
            node.renderData.before=lastNode?.address
        }
        if(srcLink && parent && node.name==='$src' && node.value){
            const address=node.value;
            parent.sourceAddress=address;
            parent.sourceLinked=addressMap[address]?true:false;
            protoAddLink(parent,{
                name:address,
                address,
                priority:'med',
                src:true,
            })
        }

        if(parent && node.name==='$link' && node.value){
            const address=node.value;
            protoAddLink(parent,{
                name:address,
                address,
                color:node.children?.['color']?.value
            })
        }

        if(autoLink && !node.special){
            protoAddAutoLinks(node);
        }
        lastNode=node;

    }

    if(revLink){
        protoUpdateLinks(nodes,addressMap);
    }
}

export const protoUpdateLinks=(nodes:ProtoNode[],addressMap:ProtoAddressMap)=>{
    for(const node of nodes){
        if(node.links){
            for(const link of node.links){
                const to=addressMap[link.address];
                if(to){
                    protoAddLink(to,{
                        name:node.name,
                        address:node.address,
                        rev:true,
                        priority:'med',
                        src:link.src
                    })
                }
            }
        }
    }
}

export const protoAddAutoLinks=(node:ProtoNode)=>{

    if(node.name!==node.type && node.types.length){
        for(const type of node.types){
            if(!type.type || type.less || !type.isRefType){
                continue;
            }
            const pri=type.important;
                const address=type.path.join('.');
                protoAddLink(node,{
                    name:address,
                    address:address,
                    priority:pri?'high':'low'
                })
        }
    }
}

export const protoGetTypeRef=(type:ProtoTypeInfo,addressMap:ProtoAddressMap):ProtoNode|undefined=>{
    if(!type?.isRefType){
        return undefined;
    }
    if(!type.path){
        return addressMap[type.type];
    }
    return protoGetNodeAtPath(type.path,addressMap);
}

export const protoGetNodeAtPath=(path:string[]|string,addressMap:ProtoAddressMap,relative?:ProtoNode):ProtoNode|undefined=>{

    if(typeof path === 'string'){
        if(!path){
            return undefined;
        }
        if(!path.includes('.')){
            return addressMap[path];
        }
        path=path.split('.');
    }
    if(!path?.length){
        return undefined;
    }
    if(!path[0] && relative){
        const p=protoGetNodeParent(relative);
        if(p){
            path[0]=p.address;
        }
    }
    let node:ProtoNode|undefined=addressMap[path[0]];

    for(let i=1;i<path.length;i++){

        if(!node){
            return undefined;
        }

        const key=path[i];

        let jmp=false;
        for(const type of node.types){
            if(!type.isRefType){
                continue;
            }
            const refType:ProtoNode|undefined=addressMap[type.type];
            const refNode:ProtoNode|undefined=refType?.children?.[key];
            if(refNode){
                node=refNode;
                jmp=true;
                break;
            }
        }
        if(jmp){
            continue;
        }

        node=node?.children?.[key];
    }
    return node;
}


export const protoAddLink=(node:ProtoNode,link:ProtoLink,allowDuplicates=false):boolean=>{

    deleteUndefined(link);

    if(node.links && !allowDuplicates){
        for(const l of node.links){
            if(l.address===link.address){
                return false;
            }
        }
    }

    if(!node.links){
        node.links=[];
    }
    node.links.push(link);
    return true;
}

export const protoChildrenToArray=(children:ProtoChildren|null|undefined):ProtoNode[]=>{
    if(!children){
        return [];
    }
    const ary:ProtoNode[]=[];
    for(const name in children){
        ary.push(children[name]);
    }
    return ary;
}

export const protoFlattenHierarchy=(node:ProtoNode):ProtoNode[]=>{
    const ary:ProtoNode[]=[];

    protoAddFlattenedHierarchy(node,ary);

    return ary;
}


export const protoAddFlattenedHierarchy=(node:ProtoNode, ary:ProtoNode[])=>{
    ary.push(node);
    if(node.children){
        for(const name in node.children){
            protoAddFlattenedHierarchy(node.children[name],ary)
        }
    }
}

export interface ProtoRenderOptions
{
    rootNode?:ProtoNode,
    nodes?:ProtoNode[],
    maxDepth?:number,
    hideSpecial?:boolean;
    hideContent?:boolean;
    hideTypeInfo?:boolean;
    filter?:(node:ProtoNode)=>boolean,
    renderer?:(node:ProtoNode,renderData:ProtoNodeRenderData)=>ProtoNodeRenderData;
}

export const protoRenderLines=({
    rootNode,
    nodes,
    maxDepth,
    hideContent,
    hideSpecial,
    hideTypeInfo,
    filter,
    renderer,
}:ProtoRenderOptions):string[]=>{

    if(!nodes && rootNode){
        nodes=protoFlattenHierarchy(rootNode);
    }

    if(!nodes){
        return []
    }

    const lines:string[]=[];

    for(const node of nodes){

        if(node.renderData?.input===undefined){
            if(!renderer){
                continue;
            }
            if(!node.renderData){
                node.renderData={}
            }
            node.renderData=renderer(node,node.renderData);
        }

        if( (hideContent && node.isContent) ||
            (hideSpecial && node.special) ||
            (
                !node.importantContent &&
                maxDepth!==undefined &&
                (maxDepth<(node.renderData.depth??0) || !node.renderData.input)
            )

        ){
            continue;
        }

        if(filter && !filter(node)){
            continue;
        }
        let input=node.renderData.input??'';
        if(hideTypeInfo){
            const c=input.indexOf(':');
            if(c!==-1){
                input=input.substring(0,c)+':';
            }
        }
        lines.push(input);
    }

    return lines;

}


export const protoGetPosScale=(node:ProtoNode):ProtoPosScale=>
{
    const layout=node.children?.['$layout'];
    if(!layout?.value){
        return {
            x:0,
            y:0,
            scale:1,
        };
    }
    const [x,y,w]=layout.value.split(/\s+/);

    return {
        x:safeParseNumber(x),
        y:safeParseNumber(y),
        width:safeParseNumber(w,300),
        scale:1,
    }
}

export const protoSetPosScale=(node:ProtoNode,posScale:ProtoPosScale)=>{
    let layout=node.children?.['$layout'];
    const scale=posScale.scale??1;
    const value=`${Math.round(posScale.x*scale)} ${Math.round(posScale.y*scale)} ${Math.round((posScale.width??300)*scale)}`
    if(layout){
        layout.value=value;
    }else{
        layout={
            address:'$layout',
            name:'$layout',
            type:'',
            types:[{type:'',path:[]}],
            value
        }
        protoAddChild(node,layout);
    }
    if(layout.renderData?.input!==undefined){
        delete layout.renderData.input;
    }

}

export const protoParsingResultFromNode=(node:ProtoNode):ProtoParsingResult=>{

    const allNodes=protoFlattenHierarchy(node);
    const addressMap:ProtoAddressMap={};
    for(const node of allNodes){
        if(!addressMap[node.address]){
            addressMap[node.address]=node;
        }
    }
    return {
        rootNodes:[node],
        allNodes,
        addressMap,
    }

}

export interface ProtoUpdateLayoutsOptions
{
    x?:number;
    yStart?:number;
    width?:number;
    lineHeight:number;
    getOffset?:(layout:ProtoLayout)=>Point;
    transform?:(node:ProtoNode,layout:ProtoLayout)=>ProtoLayout;
}
export const protoUpdateLayouts=(nodes:ProtoNode[],{
    x=0,
    yStart=0,
    width=300,
    lineHeight,
    getOffset,
    transform,
}:ProtoUpdateLayoutsOptions)=>{
    let y=yStart;
    for(const node of nodes){
        if(!node.renderData){
            node.renderData={};
        }

        const layout:ProtoLayout={
            left:x,
            right:x+width,
            top:y,
            bottom:y+lineHeight,
            y:y+lineHeight/2,
            node,
            getOffset,
            broken:node.links?.some(l=>l.broken)
        }

        protoSetLayout(node,transform?transform(node,layout):layout)

        y+=lineHeight+(getSubstringCount(node.renderData.input??'','\n')*lineHeight)
    }
    return y;
}


export const protoClearRevLinks=(nodes:ProtoNode[])=>{
    for(const node of nodes){
        if(!node.links){
            continue;
        }
        for(let i=0;i<node.links.length;i++){
            const link=node.links[i];
            if(link.rev){
                node.links.splice(i,1);
                i--;
            }
        }
        if(node.links.length===0){
            delete node.links;
        }

    }
}


const nodeCtrlKey=Symbol('nodeCtrlKey');

export const protoGetNodeCtrl=(node:ProtoNode|null|undefined):any=>{
    while(node){
        const ctrl=(node as any)[nodeCtrlKey];
        if(ctrl){
            return ctrl;
        }
        node=protoGetNodeParent(node);
    }
    return undefined;
}

export const protoSetNodeCtrl=(node:ProtoNode,ctrl:any)=>{
    if(node){
        if(ctrl){
            (node as any)[nodeCtrlKey]=ctrl;
        }else{
            delete (node as any)[nodeCtrlKey];
        }
    }
}

export interface ProtoRemoveDisplayChildrenOptions
{
    removeComments?:boolean;
}
/**
 * Removes children that are only used for display purposes such as $layout and renderData.
 * Returns the same node that is passed in.
 */
export const protoRemoveDisplayChildren=<T extends ProtoNode|ProtoNode[]>(node:T,options:ProtoRemoveDisplayChildrenOptions={}):T=>{

    if(Array.isArray(node)){
        for(const n of node){
            _protoRemoveDisplayChildren(n,options);
        }
    }else{
        _protoRemoveDisplayChildren(node,options);
    }

    return node;


}

const _protoRemoveDisplayChildren=(node:ProtoNode,options:ProtoRemoveDisplayChildrenOptions={})=>{

    delete node.renderData;
    if(options.removeComments){
        delete node.comment;
    }

    if(!node.children){
        return;
    }

    for(const e in node.children){

        if(e.startsWith('$layout')){
            delete node.children[e];
        }else{
            protoRemoveDisplayChildren(node.children[e]);
        }

    }

}
