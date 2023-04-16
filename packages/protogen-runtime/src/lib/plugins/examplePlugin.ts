import { joinPaths } from "@iyio/common";
import { getProtoPluginPackAndPath, protoFormatTsComment, protoGenerateTsIndex, protoIsTsBuiltType, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['example'];

const ExamplePluginConfig=z.object(
{
    /**
     * @default .examplePackage
     */
    examplePath:z.string().optional(),

    /**
     * @default "examples"
     */
    examplePackage:z.string().optional(),

    /**
     * @default "examples-index.ts"
     */
    exampleIndexFilename:z.string().optional(),
})

export const examplePlugin:ProtoPipelineConfigurablePlugin<typeof ExamplePluginConfig>=
{
    configScheme:ExamplePluginConfig,
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
        examplePackage='examples',
        examplePath=examplePackage,
        exampleIndexFilename='examples-index.ts',
    })=>{

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            examplePackage,
            examplePath,
            libStyle,
            {packagePaths,indexFilename:exampleIndexFilename}
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
            // export name under packageName
            importMap[name]=packageName;

            out.push('');
            if(node.comment){
                out.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }

            const idType=node.children?.['id']?.type??'string';
            if(!protoIsTsBuiltType(idType)){
                imports.push(idType)
            }

            out.push(`export class ${name}`);
            out.push('{')
            out.push(`${tab}id?:${idType};`)
            out.push('}')

            protoPrependTsImports(imports,importMap,out);

            outputs.push({
                path:joinPaths(path,name+'.ts'),
                content:out.join('\n')
            })

        }

        // add index file
        outputs.push({
            path:joinPaths(path,exampleIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })
    }
}
