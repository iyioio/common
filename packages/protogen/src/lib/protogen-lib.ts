import { ProtoAttribute, ProtoLayout, ProtoNode } from "./protogen-types";

const layoutKey=Symbol('protoLayout');

export const getProtoLayout=(node:ProtoNode):ProtoLayout|null=>(node as any)[layoutKey]??null;

export const setProtoLayout=(node:ProtoNode,layout:ProtoLayout|null)=>{
    if(layout){
        (node as any)[layoutKey]=layout;
    }else{
        delete (node as any)[layoutKey];
    }
}

export const getEmptyProtoLayout=():ProtoLayout=>({
    left:0,
    right:0,
    top:0,
    bottom:0,
    y:0,
    localY:0,
    lPt:{x:0,y:0},
    rPt:{x:0,y:0},
})

export const getMultiProtoAttValue=(att:ProtoAttribute|null|undefined):string[]=>{
    return att?att.multiValue??[att.value]:[];
}
