import { HashMap } from "@iyio/common";

export const protoTsTypeMap:HashMap<string>={
    'int':'number',
    'time':'number',
    'float':'number',
    'double':'number',
    '':'null'
} as const;

export const protoTsNumTypes=['number','bigint'];

export const protoGetTsType=(type:string|null|undefined):string=>{
    if(!type){
        return 'null';
    }
    return protoTsTypeMap[type]??type;
}


export const protoTsBuiltTypes=['string','number','any','bigint','boolean','date','null'] as const;

export const protoIsTsBuiltType=(type:string):boolean=>protoTsBuiltTypes.includes(type as any);

export const protoGenerateTsImports=(types:string[],importMap:HashMap<string>):string[]=>{
    const imports:HashMap<string[]>={};

    for(const t of types){
        const key=importMap[t];
        if(!key){
            throw new Error(`Unable to find type ${t} in importMap`)
        }
        let ary=imports[key];
        if(!ary){
            ary=[t];
            imports[key]=ary;
        }else if(!ary.includes(t)){
            ary.push(t);
        }
    }

    return Object.keys(imports).map(path=>`import { ${imports[path].join(', ')} } from '${path}';`);
}


export const protoPrependTsImports=(types:string[],importMap:HashMap<string>,prependTo:string[]):void=>{
    const imports=protoGenerateTsImports(types,importMap);

    if(imports.length){
        prependTo.splice(0,0,...imports);
    }
}

export const protoFormatTsComment=(comment:string,tab:string)=>(
    `${tab}/**\n${tab} * ${comment.split('\n').join(`\n${tab} * `)}\n${tab} */`
)
