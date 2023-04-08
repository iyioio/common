import { ProtoContext, protoGetTsType, protoIsTsBuiltType, protoLabelOutputLines, ProtoNode, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['comp','view','screen'];

const defaultDir='components';

const ReactPluginConfig=z.object(
{
    /**
     * @default "components"
     */
    reactCompDir:z.string().optional()
})

export const reactPlugin:ProtoPipelineConfigurablePlugin<typeof ReactPluginConfig>=
{
    configScheme:ReactPluginConfig,
    generate:async (ctx,config)=>{

        const {
            log,
            nodes,
            outputs,
        }=ctx;

        let {reactCompDir=defaultDir}=config;

        if(reactCompDir.endsWith('/') || reactCompDir.endsWith('\\')){
            reactCompDir=reactCompDir.substring(0,reactCompDir.length-1);
        }

        const supported=nodes.filter(n=>supportedTypes.includes(n.type));

        log(`reactPlugin. ${supported.length} supported node(s)`);

        const index:string[]=[];

        for(const node of supported){

            const name=await generateComponentAsync(node,ctx,config);

            index.push(`export * from './${name}';`);
        }

        if(index.length){
            outputs.push({
                path:reactCompDir+'/index.tsx',
                content:index.join('\n'),
            })
        }



    }
}

const generateComponentAsync=async (node:ProtoNode,{
    tab,
    importMap,
    outputs
}:ProtoContext,{
    reactCompDir=defaultDir
}:z.infer<typeof ReactPluginConfig>):Promise<string>=>{

    if(reactCompDir.endsWith('/') || reactCompDir.endsWith('\\')){
        reactCompDir=reactCompDir.substring(0,reactCompDir.length-1);
    }

    const imports:string[]=[];
    const name=node.name;
    let startI:number;
    const out:string[]=[];
    const props=node.children?.['props']?.children;
    if(props){
        startI=out.length;
        out.push(`export interface ${name}Props`);
        out.push('{')
        for(const name in props){
            const p=props[name];
            if(p.special || p.comment){
                continue;
            }
            const type=protoGetTsType(p.type);
            if(!protoIsTsBuiltType(type) && !imports.includes(type)){
                imports.push(type);
            }
            out.push(`${tab}${name}:${type};`);
        }
        out.push('}');
        protoLabelOutputLines(out,'props',startI);
        out.push('');
    }

    startI=out.length;
    out.push(`export function ${name}(${props?'{':')'}`);
    if(props){
        for(const name in props){
            const p=props[name];
            if(p.special || p.comment){
                continue;
            }
            const defaultValue=p.children?.['default']?.value;
            out.push(`${tab}${name}${defaultValue?'='+defaultValue:''},`);
        }
        out.push(`}:${name}Props){`);
    }else{
        out.push('{')
    }

    protoLabelOutputLines(out,'comp-head',startI);

    out.push(`${tab}return (`)
    out.push(`${tab}${tab}<div></div>`)
    out.push(`${tab})`)
    out.push('}')

    if(imports.length){
        protoPrependTsImports(imports,importMap,out);
    }

    outputs.push({
        path:reactCompDir+'/'+name+'.tsx',
        content:out.join('\n'),
        autoMerge:true,
    })

    return name;

}


