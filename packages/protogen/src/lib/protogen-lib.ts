import { InvalidProtoCallableArgsError, ProtoCallable, ProtoCallableNotImplementedError, ProtoLayout, ProtoNode, ProtoTypeInfo } from "./protogen-types";

const layoutKey=Symbol('protoLayout');

export const commonProtoFeatures={
    callables:'callables'
} as const;

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

/**
 * Returns a copy of the passed in type with package info populated. If the type is not found
 * in the import map a copy without package info is returned.
 */
export const addPackageInfoToProtoType=(type:ProtoTypeInfo,importMap:Record<string,string>,varName?:string):ProtoTypeInfo=>{
    const pkg=importMap[type.type];
    if(!pkg){
        return {varName,...type}
    }
    return {
        varName,
        ...type,
        package:pkg,
        exportName:type.type
    }
}

/**
 * Invokes a callable. If the callable defines an argScheme the provided namedArgs are validated
 * before invoking the callables implementation. If the callable does not define an implementation
 * a ProtoCallableNotImplementedError is thrown.
 */
export const invokeProtoCallable=(callable:ProtoCallable,namedArgs:Record<string,any>):any=>{
    if(!callable.implementation){
        throw new ProtoCallableNotImplementedError(`Callable ${callable.name} does not define an implementation`);
    }
    if(callable.argsScheme){
        const r=callable.argsScheme.safeParse(namedArgs);
        if(!r.success){
            throw new InvalidProtoCallableArgsError(`Provided args for callable ${callable.name} are invalid`,r.error);
        }
        namedArgs=r.data;
    }

    const args:any[]=[];
    for(const arg of callable.args){
        if(arg.varName){
            args.push(namedArgs[arg.varName]);
        }
    }

    return callable.implementation(...args);
}


export const getProtoAutoDeleteComment=(dependencies:string[])=>`/* <ALLOW_AUTO_DELETE DEPENDENCIES="${dependencies.join(', ')}" /> */`;

export const getProtoAutoDeleteDeps=(firstLine:string):string[]|undefined=>{
    const match=/<ALLOW_AUTO_DELETE\s+DEPENDENCIES="([^"]+)"\s*\/>/.exec(firstLine);
    return match?.[1]?.split(',').map(d=>d.trim()).filter(d=>d);
}
