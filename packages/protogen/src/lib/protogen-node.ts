import { deleteUndefined } from "@iyio/common";
import { ProtoAddressMap, ProtoLink, _ProtoNode as ProtoNode } from "./protogen-types";

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

        if(node.parserMetadata?.before){
            const before=destMap[node.parserMetadata.before];
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
            if(node.parserMetadata && !node.parserMetadata.before){
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
}

export const protoNormalizeNodes=(nodes:ProtoNode[],{
    autoLink=true,
    revLink=true,
    srcLink=true,
    updateBefore=true,
    addressMap=protoCreateNodeAddressMap(nodes),
}:ProtoNormalizeNodesOptions={})=>{
    let lastNode=null;
    for(const node of nodes){

        const parent=protoGetNodeParent(node);

        if(updateBefore && node.parserMetadata && lastNode){
            node.parserMetadata.before=lastNode?.address
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

    lastNode=null;
    for(const node of nodes){
        if(revLink && node.links){
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
        lastNode=node;
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
            protoAddLink(node,{
                name:refType.type,
                address:refType.type,
                low:pri
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
