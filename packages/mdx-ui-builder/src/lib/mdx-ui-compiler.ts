import { deepClone } from "@iyio/common";
import { compile } from "@mdx-js/mdx";
import { defaultMdxUiClassNamePrefix } from "./mdx-ui-builder-lib";
import { MdxUiAtt, MdxUiCompileOptions, MdxUiCompileResult, MdxUiImportReplacement, MdxUiNode } from "./mdx-ui-builder-types";
import { getWrapper, wrapClassName } from "./parsing-util";


export const compileMdxUiAsync=async (code:string,{
    mdxJsOptions,
    sourceMap,
    importReplacer,
    discardReplaced,
    wrapElem='div'
}:MdxUiCompileOptions={}):Promise<MdxUiCompileResult>=>{

    if(sourceMap===true){
        sourceMap={}
    }

    const {
        lookupClassNamePrefix=defaultMdxUiClassNamePrefix
    }=(sourceMap??{});

    const cOptions=mdxJsOptions?{...mdxJsOptions}:{};

    const importReplacements:MdxUiImportReplacement[]=[];
    if(importReplacer){
        const replaced:string[]=[];
        let replaceError:any;
        code=code.replace(/(^|\n)\s*import\s*\{([^}]*)\}[^'"]*['"]([^'"]+)['"]\s*;?/g,(fullMatch,_,_names:string,packageName:string)=>{
            try{
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
                    }
                }
                if(names.length){
                    return `import { ${names.join(', ')} } from "${packageName}";`
                }else{
                    return '';
                }
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

    if(sourceMap){
        cOptions.rehypePlugins.push(()=>{
            return (_tree:MdxUiNode,file,next)=>{
                if(wrapElem){

                }
                navTree(_tree,lookup,lookupClassNamePrefix);
                //console.info('TREE',_tree);
                tree=_tree
                next()

            }
        })
    }
    const file=await compile(code,cOptions);

    if(typeof file.value !== 'string'){
        throw new Error('compile value is not a string')
    }

    const result:MdxUiCompileResult={
        code:file.value,
        importReplacements
    }

    if(sourceMap){

        if(!tree){
            throw new Error('tree not set by rehype plugin');
        }

        result.sourceMap={
            tree:deepClone(tree,200),
            lookup,
            lookupClassNamePrefix,
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

    if(att.value?.data?.estree){
        wrapClassName(att,className)
    }else{
        att.value=addClass(att.value,className);
    }
}

let domId=0;
const navTree=(node:MdxUiNode,lookup:Record<string,MdxUiNode>,prefix:string)=>{
    if(!node.attributes){
        node.attributes=[];
    }
    let cat=node.attributes.find(att=>att.name==='className');
    if(!cat){
        cat={
            name:'className',
            type:"mdxJsxAttribute",
            position:{
                start:{line:1,column:1,offset:1},
                end:{line:1,column:1,offset:1},
            },
            value:''
        }
        node.attributes.push(cat);
    }


    const id=prefix+(++domId);
    addAttClass(cat,id);

    if(!node.properties){
        node.properties={};
    }
    node.properties['className']=addClass(node.properties['className'],id);

    lookup[id]=node;

    if(node.children){
        for(const child of node.children){
            navTree(child,lookup,prefix);
        }
    }
}

