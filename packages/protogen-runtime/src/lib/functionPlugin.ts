import { joinPaths } from "@iyio/common";
import { addTsImport, getProtoPluginPackAndPath, protoFormatTsComment, protoGenerateTsIndex, protoGetChildren, protoIsTsBuiltType, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['function'];

const FunctionPluginConfig=z.object(
{
    /**
     * @default .functionPackage
     */
    functionPath:z.string().optional(),

    /**
     * @default "functions"
     */
    functionPackage:z.string().optional(),

    /**
     * @default "functions-index.ts"
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
    },{
        functionPackage='functions',
        functionPath=functionPackage,
        functionIndexFilename='functions-index.ts',
    })=>{

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            functionPackage,
            functionPath,
            {packagePaths,indexFilename:functionIndexFilename}
        );

        const supported=nodes.filter(n=>supportedTypes.includes(n.type));

        log(`${supported.length} supported node(s)`);

        const imports:string[]=[];
        const addImport=(im:string,pkg?:string)=>{
            addTsImport(im,pkg,imports,importMap);
        }

        for(const node of supported){

            const out:string[]=[];

            out.push('');
            if(node.comment){
                out.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }

            const name=node.name;

            importMap[name]=packageName;

            const isAsync=name.toLowerCase().endsWith('async') || node.children?.['async']!==undefined;
            const args=protoGetChildren(node.children?.['args'],false);
            const returnTypeBase=node.children?.['return']?.type||'void';
            const returnType=isAsync?`Promise<${returnTypeBase}>`:returnTypeBase;

            if(!protoIsTsBuiltType(returnTypeBase)){
                addImport(returnTypeBase);
            }

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

            out.push(`${tab}// ${name}`)

            out.push('}');

            if(imports.length){
                protoPrependTsImports(imports,importMap,out);
            }

            outputs.push({
                path:joinPaths(path,name+'.ts'),
                content:out.join('\n')
            })

        }

        outputs.push({
            path:joinPaths(path,functionIndexFilename),
            content:'',
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })
    }
}
