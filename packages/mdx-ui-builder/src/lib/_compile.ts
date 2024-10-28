import type { CompileOptions } from '@mdx-js/mdx';
import { Compatible, VFile } from 'vfile';

let mdxJs:{
    compile:(
        vfileCompatible:Readonly<Compatible>,
        compileOptions?:Readonly<CompileOptions>

    )=>Promise<VFile>;
    compileSync:(
        vfileCompatible:Readonly<Compatible>,
        compileOptions?:Readonly<CompileOptions>

    )=>VFile;
}|null=null;

export const loadMdxJsAsync=async ()=>{
    if(mdxJs){
        return mdxJs;
    }
    const m=await import('@mdx-js/mdx');
    mdxJs=m;
    return m;
}

export const compileAsync=async (
    vfileCompatible:Readonly<Compatible>,
    compileOptions?:Readonly<CompileOptions>

):Promise<VFile>=>{
    return (await loadMdxJsAsync()).compile(vfileCompatible,compileOptions);
}

export const compileSync=(
    vfileCompatible:Readonly<Compatible>,
    compileOptions?:Readonly<CompileOptions>
):VFile=>{
    if(!mdxJs){
        throw new Error('mdxJs not loaded. Call loadMdxJsAsync first');
    }
    return mdxJs.compileSync(vfileCompatible,compileOptions);
}
