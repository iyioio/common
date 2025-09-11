import { getDirectoryName, getFileExt, joinPaths, strFirstToUpper } from "@iyio/common";
import { mkdir, readFile, readdir, stat, writeFile } from "fs/promises";
import { z } from "zod";

const defaultIgnore=['node_modules','.DS_Store'];

export const GenerateObjectFileSystemTemplateOptionsScheme=z.object({
    sourceDir:z.string(),
    baseName:z.string().optional(),
    /**
     * Filenames to ignore.
     * @default ['node_modules','.DS_Store']
     */
    ignore:z.string().or(z.custom<RegExp>()).array().optional(),

    output:z.string().array().optional(),

    recursive:z.boolean().optional(),

    bodyOnly:z.boolean().optional(),

    name:z.string().optional(),

    transformer:z.string().optional(),

    transformerParam:z.string().optional(),
});

export type GenerateObjectFileSystemTemplateOptions=z.infer<typeof GenerateObjectFileSystemTemplateOptionsScheme>;


export const generateObjectFileSystemTemplateAsync=async ({
    sourceDir,
    baseName='',
    ignore=defaultIgnore,
    output=[],
    recursive=false,
    bodyOnly,
    name='Template',
    transformer,
    transformerParam,
}:GenerateObjectFileSystemTemplateOptions):Promise<string[]>=>{

    const names:string[]=[]

    const startI=output.length;

    await _generateObjectFileSystemTemplateAsync({
        sourceDir,
        baseName,
        ignore,
        output,
        recursive,
        names,
    });

    if(bodyOnly){
        return output;
    }

    const trans=transformer?.split('/');
    const transFunc=trans?trans[trans.length-1]:null;

    const head:string[]=[];
    if(trans){
        const it=[...trans];
        it.pop();
        head.push(`import { ${transFunc} as __transformer__ } from "${it.join('/')}";`);
        head.push('');
    }
    head.push(`export interface ${strFirstToUpper(name)}Options{`)
    if(transFunc && transformerParam){
        head.push(`    ${transformerParam}:Parameters<typeof __transformer__>[1];`)
    }
    head.push(...(names??[]).map(v=>`    ${v}:string;`))
    head.push('}')

    head.push('')

    head.push(`export const ${name}=({`)
    if(transFunc && transformerParam){
        head.push(`    ${transformerParam}:__transformerParam__,`)
    }
    head.push(...(names??[]).map(v=>`    ${v},`))
    head.push(`}:${strFirstToUpper(name)}Options)=>{`)
    head.push('    const files={')

    output.splice(startI,0,...head);
    output.push('    }')
    if(transFunc){
        output.push(`    return __transformer__(files${transformerParam?',__transformerParam__':''});`)
    }else{
        output.push('    return files;')
    }
    output.push('}')

    return output;

}

interface GenerateOptions
{
    sourceDir:string;
    baseName:string;
    output:string[];
    names:string[];
    ignore:(string|RegExp)[];
    recursive:boolean;
}

export const _generateObjectFileSystemTemplateAsync=async ({
    sourceDir,
    baseName='',
    output,
    names,
    ignore=defaultIgnore,
    recursive
}:GenerateOptions)=>{

    const files=await readdir(sourceDir);

    for(const file of files){

        let shouldIgnore=false;
        for(const ig of ignore){
            if(typeof ig === 'string'){
                if(ig===file){
                    shouldIgnore=true;
                }
            }else if(ig.test(file)){
                shouldIgnore=true;
            }
        }
        if(shouldIgnore){
            continue;
        }

        const path=joinPaths(sourceDir,file);
        const bn=baseName?joinPaths(baseName,file):file;

        const info=await stat(path);
        if(info.isFile()){
            output.push(`${JSON.stringify(bn)}:`);
            await generateFileLiteralStringAsync(path,output,names,`/*${getFileExt(path,false,true)}*/\``,'`,');
        }else if(recursive && info.isDirectory()){
            await _generateObjectFileSystemTemplateAsync({
                sourceDir:path,
                output,
                ignore,
                recursive,
                baseName:bn,
                names
            })
        }

    }

}

export const generateFileLiteralStringAsync=async (path:string,output:string[],names:string[],prefix='',suffix='')=>{
    const content=(await readFile(path)).toString();
    const lines=(
        content
        .replace(/`/g,'\\`')
        .replace(/\${/g,'$\\{')
        .replace(/___\$(\w+)___/g,(_,name)=>{
            if(!names.includes(name)){
                names.push(name);
            }
            return `$\{${name}}`;
        })
        .split('\n')
    )
    lines[0]=prefix+lines[0];
    lines[lines.length-1]+=suffix;
    for(let i=0;i<lines.length;i++){
        output.push(lines[i]??'');
    }
}

export const evalTmplLines=(lines:string[],args:string|Record<string,string>):Record<string,string>=>{
    if(typeof args === 'string'){
        const parts=args.split(',');
        args={};
        for(const p of parts){
            const [n,v]=p.split(':');
            args[n?.trim()??'']=v?.trim()??'';
        }
    }
    let argsExp='';
    for(const e in args){
        argsExp+=`const ${e}=${JSON.stringify(args[e])};\n`;
    }
    const invoker=new Invoker();
    invoker.invoke(`
        ${argsExp}
        this.value={${lines.join('\n')}}
    `);
    return invoker.value;
}

class Invoker
{
    public value:any;

    public args:Record<string,string>={}

    public invoke(code:string){
        (globalThis as any).eval(code);
    }
}

export interface WriteTmplOptions
{
    outDir:string;
    files:Record<string,string>;
    dryRun?:boolean;
}

export const writeTmplAsync=async ({
    outDir,
    files,
    dryRun
}:WriteTmplOptions):Promise<void>=>{
    const promises:Promise<void>[]=[];

    for(const e in files){
        promises.push((async ()=>{
            const path=joinPaths(outDir,e);
            const dir=getDirectoryName(path);
            const content=files[e];
            console.info(`${path} - ${Math.ceil((content??'').length/1000)}KB`)
            if(!dryRun){
                await mkdir(dir,{recursive:true});
                await writeFile(path,content??'');
            }
        })())
    }

    await Promise.all(promises);
}
