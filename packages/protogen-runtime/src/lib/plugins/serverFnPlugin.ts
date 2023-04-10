import { joinPaths } from "@iyio/common";
import { getProtoPluginPackAndPath, protoFormatTsComment, protoIsTsBuiltType, protoLabelOutputLines, protoMergeTsImports, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['serverFn'];

const ServerFnPluginConfig=z.object(
{
    /**
     * @default .serverFnPackage
     */
    serverFnPath:z.string().optional(),

    /**
     * @default "serverFns"
     */
    serverFnPackage:z.string().optional(),

    /**
     * @default "handler"
     */
    serverFnHandlerName:z.string().optional(),

    /**
     * @default "@iyio/common"
     */
    serverFnLibPackage:z.string().optional(),
})

export const serverFnPlugin:ProtoPipelineConfigurablePlugin<typeof ServerFnPluginConfig>=
{
    configScheme:ServerFnPluginConfig,
    generate:async ({
        importMap,
        outputs,
        tab,
        log,
        nodes,
        namespace,
    },{
        serverFnPackage='serverFns',
        serverFnPath=serverFnPackage,
        serverFnHandlerName='handler',
        serverFnLibPackage='@iyio/common',
    })=>{

        const {path}=getProtoPluginPackAndPath(
            namespace,
            serverFnPackage,
            serverFnPath
        );

        const supported=nodes.filter(n=>supportedTypes.includes(n.type));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }


        for(const node of supported){

            const out:string[]=[];
            const imports:string[]=[];

            const name=node.name;

            const handlerName=node.children?.['handlerName']?.value??serverFnHandlerName;
            const isDefault=handlerName==='default';

            const inputType=node.children?.['input']?.type??'void';
            const outputType=node.children?.['output']?.type??'void';
            const inputPackage=importMap[inputType+'Scheme'];
            const outputPackage=importMap[outputType+'Scheme'];

            if(!protoIsTsBuiltType(inputType)){
                imports.push(inputType)
            }

            if(!protoIsTsBuiltType(outputType)){
                imports.push(outputType)
            }

            out.push(`import { createFnHandler, FnEvent } from '${serverFnLibPackage}';`)
            out.push('');
            if(node.comment){
                out.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }
            const startI=out.length;
            out.push(`const ${name}=async (`);
            out.push(`${tab}fnEvt:FnEvent${inputType==='void'?'':','}`);
            out.push(`${inputType==='void'?'':`${tab}input:${inputType}`}`);
            out.push(`):Promise<${outputType}>=>{`);
            protoLabelOutputLines(out,'head',startI);


            out.push(`${tab}// do cool stuff`)
            out.push('}')
            out.push('');
            out.push(isDefault?`export default ${name};`:`export const ${handlerName}=createFnHandler(${name},{`);
            if(inputPackage){
                imports.push(inputType+'Scheme');
                out.push(`${tab}inputScheme:${inputType}Scheme,`)
            }
            if(outputPackage){
                imports.push(outputType+'Scheme');
                out.push(`${tab}outputScheme:${outputType}Scheme,`)
            }
            out.push('});');

            protoPrependTsImports(imports,importMap,out);

            outputs.push({
                path:joinPaths(path,name+'.ts'),
                content:out.join('\n'),
                autoMerge:true,
                mergeHandler:protoMergeTsImports
            })

        }
    }
}
