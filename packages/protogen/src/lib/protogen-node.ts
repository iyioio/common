import { deleteUndefined, getSubstringCount, Point, safeParseNumber } from "@iyio/common";
import { protoSetLayout } from "./protogen-lib";
import { ProtoAddressMap, ProtoChildren, ProtoLayout, ProtoLink, ProtoNode, ProtoNodeRenderData, ProtoParsingResult, ProtoPosScale } from "./protogen-types";

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

export const protoGetNodeParent=(node:ProtoNode):ProtoNode|undefined=>(node as any)[parentKey];

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
        types:[{type}]
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

        if(updateBefore && node.renderData && lastNode){
            node.renderData.before=lastNode?.address
        }
        if(srcLink && parent && node.name==='$src' && node.value){
            const address=getLinkAddress(node,node.value)
            parent.sourceAddress=address;
            parent.sourceLinked=addressMap[address]?true:false;
            protoAddLink(parent,{
                name:address,
                address,
                low:true,
                src:true,
            })
        }

        if(parent && node.name==='$link' && node.value){
            const address=getLinkAddress(node,node.value)
            protoAddLink(parent,{
                name:address,
                address,
            })
        }

        if(autoLink){

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
                        low:true,
                        src:link.src
                    })
                }else{
                    link.broken=true;
                }
            }
        }
    }
}

const getDecProp=(node:ProtoNode,propName:string):ProtoNode|null=>{

    const parent=protoGetNodeParent(node);
    if(!parent?.children){
        return null;
    }

    const match=parent.children[propName];
    if(match){
        return match;
    }

    return getDecProp(parent,propName);

}

export const protoAddAutoLinks=(node:ProtoNode)=>{

    if(node.name!==node.type && node.types.length){
        const refType=node.types[node.types.length-1];
        if(!refType.type){
            return;
        }
        const pri=refType.flags?.includes('*');
        if(refType && refType.type.charAt(0).toUpperCase()===refType.type.charAt(0) && !node.links?.length){
            const address=refType.type+(refType.refProp?'.'+refType.refProp:'');
            protoAddLink(node,{
                name:address,
                address:address,
                low:!pri
            })
        }
    }
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

const getLinkAddress=(node:ProtoNode,value:string)=>{
    const match=/^\.(\$?\w+)(.*)/.exec(value);
    if(match){
        const prop=getDecProp(node,match[1]);
        if(prop){
            return prop.type+match[2];
        }else{
            return value;
        }
    }else{
        return value;
    }
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
    filter?:(node:ProtoNode)=>boolean,
    renderer?:(node:ProtoNode,renderData:ProtoNodeRenderData)=>ProtoNodeRenderData;
}

export const protoRenderLines=({
    rootNode,
    nodes,
    maxDepth,
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

        if( !node.importantContent &&
            maxDepth!==undefined &&
            (maxDepth<(node.renderData.depth??0) || !node.renderData.input)
        ){
            continue;
        }

        if(filter && !filter(node)){
            continue;
        }
        lines.push(node.renderData.input??'');
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
            types:[{type:''}],
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
}
export const protoUpdateLayouts=(nodes:ProtoNode[],{
    x=0,
    yStart=0,
    width=300,
    lineHeight,
    getOffset
}:ProtoUpdateLayoutsOptions)=>{
    let y=yStart;
    for(const node of nodes){
        if(!node.renderData){
            node.renderData={};
        }

        protoSetLayout(node,{
            left:x,
            right:x+width,
            top:y,
            bottom:y+lineHeight,
            y:y+lineHeight/2,
            node,
            getOffset,
        })

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
