import { joinPaths, requireUnrootPath } from "@iyio/common";
import { addTsImport, getProtoPluginPackAndPath, ProtoContext, protoFormatTsComment, protoGenerateTsIndex, protoGetTsType, protoIsTsBuiltType, protoLabelOutputLines, protoMergeTsImports, ProtoNode, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['comp','view','screen'];

const ReactCompPluginConfig=z.object(
{
    /**
     * @default .reactPackage
     */
    reactCompPath:z.string().optional(),

    /**
     * @default "react-comp-index.ts"
     */
    reactCompIndexFilename:z.string().optional(),

    /**
     * @default false
     */
    reactCompUseStyledJsx:z.boolean().optional(),


    /**
     * @default "components"
     */
    reactCompPackage:z.string().optional(),
})

export const reactCompPlugin:ProtoPipelineConfigurablePlugin<typeof ReactCompPluginConfig>=
{
    configScheme:ReactCompPluginConfig,
    generate:async (ctx,config)=>{

        const {
            log,
            nodes,
            outputs,
            packagePaths,
            namespace,
            libStyle,
        }=ctx;

        const {
            reactCompPackage='components',
            reactCompPath,
            reactCompIndexFilename='react-comp-index.ts'
        }=config;

        const {path}=getProtoPluginPackAndPath(
            namespace,
            reactCompPackage,
            reactCompPath,
            libStyle,
            {packagePaths,indexFilename:reactCompIndexFilename}
            );

        const supported=nodes.filter(n=>supportedTypes.includes(n.type));

        log(`reactPlugin. ${supported.length} supported node(s)`);

        for(const node of supported){

            log(`component - ${node.name}`);

            await generateComponentAsync(node,ctx,config);
        }

        if(supported.length){
            outputs.push({
                path:joinPaths(path,reactCompIndexFilename),
                content:'',
                isPackageIndex:true,
                generator:{
                    root:path,
                    recursive:true,
                    generator:protoGenerateTsIndex
                }
            })
        }
    }
}

const generateComponentAsync=async (node:ProtoNode,{
    tab,
    importMap,
    outputs,
    namespace,
    libStyle,
}:ProtoContext,{
    reactCompPackage='components',
    reactCompPath,
    reactCompUseStyledJsx=false,
}:z.infer<typeof ReactCompPluginConfig>):Promise<string>=>{


    const {path,packageName}=getProtoPluginPackAndPath(namespace,reactCompPackage,reactCompPath,libStyle);


    const imports:string[]=[];
    const addImport=(im:string,pkg?:string)=>{
        addTsImport(im,pkg,imports,importMap);
    }
    const name=node.name;
    const filename=requireUnrootPath(node.children?.['$filename']?.value?.trim()??name+'.tsx');

    importMap[name]=packageName;
    importMap[name+'Props']=packageName;

    const baseLayout=node.children?.['baseLayout'];
    const baseLayoutType=baseLayout?getBaseLayoutName(baseLayout.value||'outer'):null;
    if(baseLayoutType){
        addImport(baseLayoutType,'@iyio/common');
        addImport('bcn','@iyio/common');
    }

    let startI:number;
    const out:string[]=[];
    const propsNode=node.children?.['props'];
    const props=propsNode?.children;

    if(props){
        out.push('');
        if(propsNode.comment){
            out.push(...protoFormatTsComment(propsNode.comment,'').split('\n'))
        }
        startI=out.length;
        out.push(`export interface ${name}Props`);
        out.push('{')
        for(const name in props){
            const p=props[name];
            if(p.special || p.isContent){
                continue;
            }
            const type=protoGetTsType(p.type);
            if(!protoIsTsBuiltType(type)){
                addImport(type);
            }
            if(p.comment){
                out.push(...protoFormatTsComment(p.comment,tab).split('\n'));
            }
            out.push(`${tab}${name}:${type};`);
        }
        protoLabelOutputLines(out,'props',startI);
        out.push('}');
        out.push('');
    }

    if(node.comment){
        out.push(...protoFormatTsComment(node.comment,'').split('\n'))
    }

    startI=out.length;
    out.push(`export function ${name}(${props?'{':')'}`);
    protoLabelOutputLines(out,'comp',startI);
    if(props){
        for(const name in props){
            const p=props[name];
            if(p.special || p.isContent){
                continue;
            }
            const defaultValue=p.children?.['default']?.value;
            out.push(`${tab}${name}${defaultValue?'='+defaultValue:''},`);
        }
        if(baseLayoutType){
            out.push(`${tab}...props`)
            out.push(`}:${name}Props & ${baseLayoutType}){`);
        }else{
            out.push(`}:${name}Props){`);
        }
    }else{
        out.push('{')
    }

    out.push('');
    out.push(`${tab}return (`)

    if(baseLayoutType){
        out.push(`${tab}${tab}<div className={bcn(props,'${name}')}>`)
    }else{
        out.push(`${tab}${tab}<div className="${name}">`)
    }
    const bodyTab=`${tab}${tab}${tab}`;
    out.push('');
    out.push(`${bodyTab}${name}`);
    out.push('');
    if(reactCompUseStyledJsx || node.children?.['styled-jsx']){
        out.push(`${bodyTab}<style global jsx>{\``);
        out.push(`${bodyTab}${tab}.${name}{`);
        out.push(`${bodyTab}${tab}${tab}display:flex;`);
        out.push(`${bodyTab}${tab}${tab}flex-direction:column;`);
        out.push(`${bodyTab}${tab}}`);
        out.push(`${bodyTab}\`}</style>`);
    }
    out.push(`${tab}${tab}</div>`)
    out.push(`${tab})`)
    out.push('}')

    if(imports.length){
        protoPrependTsImports(imports,importMap,out);
    }

    outputs.push({
        path:joinPaths(path,filename),
        content:out.join('\n'),
        autoMerge:true,
        mergeHandler:protoMergeTsImports
    })

    return name;

}


const getBaseLayoutName=(type:string)=>{

    switch(type){
        case "inner": return 'BaseLayoutInnerProps';
        case "outer-no-flex": return 'BaseLayoutOuterNoFlexProps';
        case "base": return 'BaseLayoutProps';
        case "all": return 'AllBaseLayoutProps';
        case "outer":
        default:
            return 'BaseLayoutOuterProps';
    }
}
