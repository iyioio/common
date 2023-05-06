import { joinPaths } from "@iyio/common";
import { getProtoPluginPackAndPath, protoFormatTsComment, protoGenerateTsIndex, protoGetChildren, protoIsTsBuiltType, protoLabelOutputLines, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['function'];

const FunctionPluginConfig=z.object(
{
    /**
     * @default .functionPackage
     */
    functionPath:z.string().optional(),

    /**
     * @default "domain-functions"
     */
    functionPackage:z.string().optional(),

    /**
     * @default "domain-functions-index.ts"
     */
    functionIndexFilename:z.string().optional(),
})

export const functionPlugin:ProtoPipelineConfigurablePlugin<typeof FunctionPluginConfig>=
{
    configScheme:FunctionPluginConfig,
    generate:async ({
        importMap,
        outputs,
        tab,
        log,
        nodes,
        namespace,
        packagePaths,
        libStyle,
    },{
        functionPackage='domain-functions',
        functionPath=functionPackage,
        functionIndexFilename='domain-functions-index.ts',
    })=>{

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            functionPackage,
            functionPath,
            libStyle,
            {packagePaths,indexFilename:functionIndexFilename}
        );

        const supported=nodes.filter(n=>supportedTypes.includes(n.type));

        log(`${supported.length} supported node(s)`);

        for(const node of supported){

            const out:string[]=[];
            const imports:string[]=[];

            out.push('');
            if(node.comment){
                out.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }

            const name=node.name;

            // export name using packageName
            importMap[name]=packageName;

            const isAsync=name.toLowerCase().endsWith('async') || node.children?.['async']!==undefined;
            const args=protoGetChildren(node.children?.['args'],false);
            const returnTypeBase=node.children?.['return']?.type||'void';
            const returnType=isAsync?`Promise<${returnTypeBase}>`:returnTypeBase;

            if(!protoIsTsBuiltType(returnTypeBase)){
                imports.push(returnTypeBase);
            }

            const startI=out.length;
            const oneLiner=`export const ${name}=${isAsync?'async ':''}(${
                args.map(a=>`${a.name}:${a.type}`).join(', ')}):${returnType}=>`;
            if(oneLiner.length<=90 || args.length===0){
                out.push(oneLiner);
                out.push('{');
            }else{
                out.push(`export const ${name}=${isAsync?'async ':''}(`);
                for(let a=0;a<args.length;a++){
                    const arg=args[a];
                    out.push(`${tab}${arg.name}:${arg.type}${a===args.length-1?'':','}`)
                }
                out.push(`):${returnType}=>{`);
            }
            for(const a of args){
                if(!protoIsTsBuiltType(a.type)){
                    imports.push(a.type);
                }
            }
            protoLabelOutputLines(out,'function',startI);

            out.push('')
            out.push(`${tab}throw new Error('${name} not implemented')`)
            out.push('')

            out.push('}');

            if(imports.length){
                protoPrependTsImports(imports,importMap,out);
            }

            outputs.push({
                path:joinPaths(path,name+'.ts'),
                content:out.join('\n'),
                autoMerge:true,
            })

        }

        outputs.push({
            path:joinPaths(path,functionIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })
    }
}
