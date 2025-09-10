import { getPathNoExt, HashMap } from "@iyio/common";
import { ProtoContext, ProtoIndexGenerator, ProtoOutput } from "./protogen-pipeline-types.js";
import { ProtoNode } from "./protogen-types.js";

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


export const protoTsBuiltTypes=['string','number','any','bigint','boolean','date','null','void'] as const;

export const protoIsTsBuiltType=(type:string|null|undefined):boolean=>protoTsBuiltTypes.includes(type as any);

export const protoGenerateTsImports=(types:string[],importMap:HashMap<string>,localImportMap:HashMap<string>):string[]=>{
    const imports:HashMap<string[]>={};

    for(const t of types){
        const key=localImportMap[t]??importMap[t];
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

    return Object.keys(imports).map(path=>`import { ${imports[path]?.join(', ')} } from '${path}';`);
}


export const protoPrependTsImports=(types:string[],importMap:HashMap<string>,prependTo:string[],localImportMap:HashMap<string>={}):void=>{

    if(!types.length){
        return;
    }

    const imports=protoGenerateTsImports(types,importMap,localImportMap);

    if(imports.length){
        prependTo.splice(0,0,...imports);
    }
}

export const protoFormatTsComment=(comment:string,tab:string)=>(
    `${tab}/**\n${tab} * ${escapeComment(comment).split('\n').join(`\n${tab} * `)}\n${tab} */`
)

export const protoGetFullNodeTsComment=(node:ProtoNode,tab:string):string=>{
    const out=[`${tab}/**`];
    let comment=node.comment?.trim();
    if(comment){
        out.push(`${tab} * ${comment.split('\n').join(`\n${tab} * `)}`);
    }

    if(node.children){
        for(const c in node.children){
            const child=node.children[c];
            if(!child){
                continue;
            }
            comment=child?.comment?.trim();
            if(comment && !child.special && !child.isContent){
                out.push(`${tab} * `);
                out.push(`${tab} * ${`- ${c} - ${escapeComment(comment)}`.split('\n').join(`\n${tab} *   `)}`)
            }
        }
    }

    if(out.length<2){
        return '';
    }

    out.push(`${tab} */`);

    return out.join('\n');
}

export const protoGetFullNodeComment=(node:ProtoNode,tab:string):string=>{
    const out=[];
    let comment=node.comment?.trim();
    if(comment){
        out.push(comment);
    }

    if(node.children){
        for(const c in node.children){
            const child=node.children[c];
            if(!child){
                continue;
            }
            comment=child?.comment?.trim();
            if(comment && !child.special && !child.isContent){
                out.push('');
                out.push(`- ${c} - ${comment}`.split('\n').join('\n   '))
            }
        }
    }

    if(out.length<1){
        return '';
    }

    out.push(`${tab} */`);

    return out.join('\n');
}

const escapeComment=(comment:string)=>comment.replace(/\*\//g,'(star)/');

export const addTsImport=(im:string,packageName:string|null|undefined,imports:string[],importMap:HashMap<string>)=>{
    if(!imports.includes(im)){
        imports.push(im);
    }
    if(packageName){
        importMap[im]=packageName;
    }
}

export const protoGenerateTsIndex=(ctx:ProtoContext,generator:ProtoIndexGenerator,indexOutput:ProtoOutput,existing:string):string=>
{
    const out:string[]=[];

    ctx.autoDeletePaths.push(generator.root+(generator.recursive?(generator.root.endsWith('/')?'*':'/*'):''));

    const exclude=generator.exclude??[];
    const root=generator.root.endsWith('/')?generator.root:generator.root+'/';

    for(const o of ctx.outputs){
        if(o===indexOutput || !o.path.startsWith(root) || !/.*.tsx?$/i.test(o.path)){
            continue;
        }

        let executed=false;
        for(const ex of exclude){
            if(typeof ex === 'string'){
                if(ex.includes('/')){
                    if(ex===o.path){
                        executed=true;
                        break;
                    }
                }else if(o.path.endsWith(ex)){
                    executed=true;
                    break;
                }
            }else if(ex.test(o.path)){
                executed=true;
                break;
            }
        }

        if(executed){
            continue;
        }

        const name=getPathNoExt(o.path.substring(root.length));
        const exportPath=`./${name}`;
        if(o.mainExport){
            out.push(`export { ${o.mainExport} as ${o.mainExportAs??name.replace(/\//g,'')} } from '${exportPath}'; ${generatorComment}`);
        }else{
            out.push(`export * from '${exportPath}'; ${generatorComment}`);
        }
    }

    out.sort();

    if(existing.trim()){
        const lines=existing.split('\n');
        for(let i=0;i<lines.length;i++){
            if(generatorCommentReg.test(lines[i]??'')){
                lines.splice(i,1);
                i--;
            }
        }
        lines.unshift(...out);
        return lines.join('\n').trim()+'\n';
    }

    return out.join('\n').trim()+'\n';
}

const generatorComment='// auto-generated';
const generatorCommentReg=/\/\/\s*auto-generated\s*$/;
