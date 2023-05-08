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

export const parseProtoPrimitiveUndefined=(value:string|null|undefined):string|number|boolean|null|undefined=>{
    const v=parseProtoPrimitive(value);
    return v===''?undefined:v;
}

export const parseProtoPrimitive=(value:string|null|undefined):string|number|boolean|null|undefined=>{
    if(!value){
        return '';
    }
    if(value.startsWith('!')){
        value=value.substring(1).trim();
        if(!value){
            return value;
        }
    }
    if(/^[0-9-]/.test(value)){
        const num=Number(value);
        if(isFinite(num)){
            return num;
        }
    }
    switch(value){
        case 'true': return true;
        case 'false': return false;
        case 'null': return null;
        case 'undefined': return undefined;
        default: return value;
    }
}
