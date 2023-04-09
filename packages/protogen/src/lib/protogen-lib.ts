import { ProtoLayout, ProtoNode } from "./protogen-types";

const layoutKey=Symbol('protoLayout');

export const protoGetLayout=(node:ProtoNode):ProtoLayout|null=>(node as any)[layoutKey]??null;

export const protoGetLayoutOrDefault=(node:ProtoNode):ProtoLayout=>(node as any)[layoutKey]??protoGetEmptyLayout();

export const protoSetLayout=(node:ProtoNode,layout:ProtoLayout|null)=>{
    if(layout){
        (node as any)[layoutKey]=layout;
    }else{
        delete (node as any)[layoutKey];
    }
}

export const protoGetEmptyLayout=():ProtoLayout=>({
    left:0,
    right:0,
    top:0,
    bottom:0,
    y:0,
})

