import { joinPaths, requireUnrootPath } from "@iyio/common";
import { ProtoContext, protoFormatTsComment, protoGetTsType, protoIsTsBuiltType, protoLabelOutputLines, protoMergeTsImports, ProtoNode, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['comp','view','screen'];

const defaultDir='components';

const ReactPluginConfig=z.object(
{
    /**
     * @default "components"
     */
    reactCompDir:z.string().optional(),

    /**
     * @default false
     */
    reactUseStyledJsx:z.boolean().optional(),

    /**
     * @default context.defaultPackageName
     */
    reactPackageName:z.string().optional(),
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

            log(`component - ${node.name}`);

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
    outputs,
    defaultPackageName,
}:ProtoContext,{
    reactCompDir=defaultDir,
    reactUseStyledJsx=false,
    reactPackageName=defaultPackageName,
}:z.infer<typeof ReactPluginConfig>):Promise<string>=>{

    if(reactCompDir.endsWith('/') || reactCompDir.endsWith('\\')){
        reactCompDir=reactCompDir.substring(0,reactCompDir.length-1);
    }


    const imports:string[]=[];
    const addImport=(im:string,packageName?:string)=>{
        if(!imports.includes(im)){
            imports.push(im);
        }
        if(packageName){
            importMap[im]=packageName;
        }
    }
    const name=node.name;
    let filename=node.children?.['$filename']?.value?.trim()||name;

    importMap[name]=reactPackageName;
    importMap[name+'Props']=reactPackageName;

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
    if(reactUseStyledJsx || node.children?.['styled-jsx']){
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

    filename=filename.startsWith('/')?requireUnrootPath(filename):joinPaths(reactCompDir,filename);
    if(!filename.toLowerCase().endsWith('.tsx')){
        filename+='.tsx';
    }

    outputs.push({
        path:filename,
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
