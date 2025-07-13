import z from "zod";

const isOptional=(type)=>{
    try{
        return type?.isOptional?.();
    }catch{}
}

const isNullable=(type)=>{
    try{
        return type?.isNullable?.();
    }catch{}
}

const unwrap=(type)=>{

    while(true){
        const name=getName(type);

        if(name==='ZodLazy' || name==='lazy'){
            const inner=((type._def ?? type.def))?.getter?.();
            if(!inner){
                return type;
            }
            type=inner;
        }

        if(!type.unwrap || (name!=='ZodOptional' && name!=='optional' && name!=='ZodNullable' && name!=='nullable')){
            break;
        }
        type=type.unwrap();
    }
    return type;
}

const getName=(type)=>{
    return type?._def?.typeName || type?.def?.type;
}

const out=[];
const outVar=[];
const add=(name,type,out)=>{
    out.push({
        name,
        typeName:type?._def?.typeName,
        type:type.def?.type,
        getName:getName(type),
        optional:isOptional(type),
        nullable:isNullable(type),
        unwrap:getName(unwrap(type)),
        normalize:getName(type.normalize?.()),
        getterV3:(type?._def?.getter),
        getterV4:(type?.def?.getter),
    })
}

const addVar=(name,type)=>{
    add(name,type,out);
    add(name+'.optional()',type.optional(),outVar)
    add(name+'.nullable()',type.nullable(),outVar)
    add(name+'.nullish()',type.nullish(),outVar)
    add(name+'.optional().nullable()',type.optional().nullable(),outVar)
    if(type.nonoptional){
        add(name+'.nonoptional()',type.nonoptional(),outVar)
    }
}

addVar('z.string()',z.string())
addVar('z.number()',z.number())
addVar('z.boolean()',z.boolean())
addVar('z.null()',z.null())
addVar('z.lazy()',z.lazy(()=>z.object({a:z.string()})))
addVar('z.enum()',z.enum(['a','b']))
addVar('z.literal()',z.literal(77))
addVar('z.record()',z.record())
addVar('z.any()',z.any())
addVar('z.undefined()',z.undefined())
addVar('z.array()',z.array())
addVar('z.any()',z.any())
addVar('z.union()',z.union([1,'z']))
addVar('z.record()',z.record())



console.table([...out,...outVar]);
