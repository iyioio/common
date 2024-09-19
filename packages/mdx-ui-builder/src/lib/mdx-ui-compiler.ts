import { deepClone } from "@iyio/common";
import { compile } from "@mdx-js/mdx";
import { defaultMdxUiClassNamePrefix, defaultMdxUidDeconstructProps, isMdxUiNodeOpen, isMdxUiNodeTextEditable } from "./mdx-ui-builder-lib";
import { MdxUiAtt, MdxUiCompileOptions, MdxUiCompileResult, MdxUiImportReplacement, MdxUiNode, MdxUiNodeMetadata, MdxUiSourceCodeRef } from "./mdx-ui-builder-types";
import { getWrapper, wrapClassName } from "./parsing-util";


export const compileMdxUiAsync=async (code:string,{
    mdxJsOptions,
    sourceMap,
    importReplacer,
    discardReplaced,
    wrapElem='div',
    deconstructProps=defaultMdxUidDeconstructProps,
    enableJsInitBlocks
}:MdxUiCompileOptions={}):Promise<MdxUiCompileResult>=>{

    if(sourceMap===true){
        sourceMap={}
    }
    const sourceMapOptions=sourceMap;
    const srcRef:MdxUiSourceCodeRef={src:code};

    const {
        lookupClassNamePrefix=defaultMdxUiClassNamePrefix,
        idPrefix='',
    }=(sourceMapOptions??{});

    const cOptions=mdxJsOptions?{...mdxJsOptions}:{};

    const importReplacements:MdxUiImportReplacement[]=[];
    if(importReplacer){
        const replaced:string[]=[];
        let replaceError:any;
        code=code.replace(/(^|\n)\s*import\s*\{([^}]*)\}[^'"]*['"]([^'"]+)['"]\s*;?/g,(fullMatch,_,_names:string,packageName:string)=>{
            try{
                let hasReplacements=false;
                const names=_names.split(',').map(v=>v.trim()).filter(v=>v);
                for(let i=0;i<names.length;i++){
                    const importName=names[i] as string;
                    const replacement=importReplacer(packageName,importName);
                    if(replacement!==null && replacement!==undefined){
                        importReplacements.push({
                            importName,
                            packageName,
                            content:replacement
                        })
                        names.splice(i,1);
                        i--;
                        replaced.push(replacement);
                        hasReplacements=true;

                    }
                }
                if(!hasReplacements){
                    return fullMatch;
                }
                const replaceWith=names.length?`import { ${names.join(', ')} } from "${packageName}";`:''

                const diff=fullMatch.length-replaceWith.length;
                return replaceWith+(diff>0?' '.repeat(diff):'');
            }catch(ex){
                replaceError=ex;
                console.error(`import replacement failed for: ${fullMatch}`,ex);
                return fullMatch;
            }
        });
        if(replaceError){
            throw replaceError;
        }
        if(replaced.length && !discardReplaced){
            code=code+'\n'+replaced.join('\n');
        }
    }

    let tree:MdxUiNode|undefined;
    const lookup:Record<string,MdxUiNode>={};
    const metadata:Record<string,MdxUiNodeMetadata>={};
    const nodesIds:string[]=[];

    if(!cOptions.rehypePlugins){
        cOptions.rehypePlugins=[];
    }

    if(wrapElem){
        cOptions.rehypePlugins.push(()=>{
            return (_tree:MdxUiNode,file,next)=>{
                const wrapper=getWrapper('div','');
                wrapper.children=_tree.children;
                _tree.children=[wrapper];
                next()

            }
        })
    }

    if(sourceMapOptions){
        cOptions.rehypePlugins.push(()=>{
            return (_tree:MdxUiNode,file,next)=>{
                if(wrapElem){

                }
                navTree(
                    srcRef,
                    _tree,
                    lookup,
                    metadata,
                    nodesIds,
                    sourceMapOptions.includeTextEditableChildren??false,
                    lookupClassNamePrefix+idPrefix
                );
                //console.info('TREE',_tree);
                tree=_tree
                next()

            }
        })
    }
    if(enableJsInitBlocks){
        const hookOpen='<Hook i={()=>{'
        code=code.replace(/(```\s*js\s+__init__)((.|\n|\r)*?)```/g,(_,open:string,code:string)=>(
            // the added spaces keep the source positioning synced
            `${hookOpen}${' '.repeat((open.length-hookOpen.length-1))}${code}}}/>`
        ));
    }
    const file=await compile(code,cOptions);

    if(typeof file.value !== 'string'){
        throw new Error('compile value is not a string')
    }

    const result:MdxUiCompileResult={
        code:file.value,
        importReplacements
    }

    if(deconstructProps){
        result.code=result.code.replace(
            /function\s+_createMdxContent\(\s*props\s*\)\s*\{/,
            `function _createMdxContent(props) {const {${deconstructProps.map(p=>{
                if(typeof p === 'string'){
                    return p;
                }else{
                    return `${p.proxy?`${p.name}:_proxy_${p.name}`:p.name}${p.asName?':'+p.asName:''}${p.default?'='+p.default:''}`
                }
            }).join(',')}}=props;${deconstructProps.map(p=>{
                if((typeof p === 'string') || !p.proxy){
                    return '';
                }
                return `const ${p.name}=useProxy(_proxy_${p.name});`;
            }).join('')}`
        )
    }

    if(sourceMapOptions){

        if(!tree){
            throw new Error('tree not set by rehype plugin');
        }

        result.sourceMap={
            sourceCode:srcRef.src,
            tree:deepClone(tree,200),
            lookup,
            metadata,
            lookupClassNamePrefix,
            nodesIds,
        }
    }

    return result;

}



const addClass=(src:string|null|undefined,className:string):string=>{
    if(!src){
        return className;
    }
    return src+' '+className;
}
const addAttClass=(att:MdxUiAtt,className:string):void=>{

    att.sourceValue=att.value;
    if(att.value?.data?.estree){
        wrapClassName(att,className)
    }else{
        att.value=addClass(att.value,className);
    }
}

let noPosId=0;
const navTree=(
    src:MdxUiSourceCodeRef,
    node:MdxUiNode,
    lookup:Record<string,MdxUiNode>,
    metadata:Record<string,MdxUiNodeMetadata>,
    nodesIds:string[],
    includeTextEditableChildren:boolean,
    prefix:string
)=>{
    if(!node.attributes){
        node.attributes=[];
    }
    let cat=node.attributes.find(att=>att.name==='className');
    if(!cat){
        cat={
            name:'className',
            type:"mdxJsxAttribute",
            value:''
        }
        node.attributes.push(cat);
    }

    let instId=0;
    const hash=node.name||(++noPosId).toString();
    let id=prefix+instId+'-'+hash;
    while(lookup[id]){
        id=prefix+(++instId)+'-'+hash;
    }
    addAttClass(cat,id);

    if(!node.properties){
        node.properties={};
    }
    node.properties['className']=addClass(node.properties['className'],id);

    lookup[id]=node;
    nodesIds.push(id);

    const textEditable=isMdxUiNodeTextEditable(node);
    const open=isMdxUiNodeOpen(node,src);

    if(textEditable || open){
        metadata[id]={
            textEditable,
            open
        }
    }

    if(node.children && !(textEditable && !includeTextEditableChildren)){
        for(const child of node.children){
            navTree(src,child,lookup,metadata,nodesIds,includeTextEditableChildren,prefix);
        }
    }
}

