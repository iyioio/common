import { asArray, joinPaths, parseCliArgsT } from "@iyio/common";
import { readFile, readdir, stat, writeFile } from "fs/promises";
import { GenerateObjectFileSystemTemplateOptions, GenerateObjectFileSystemTemplateOptionsScheme, evalTmplLines, generateObjectFileSystemTemplateAsync, writeTmplAsync } from "../lib/templateGenerator.js";

interface TemplateItem extends Omit<GenerateObjectFileSystemTemplateOptions,'output'>
{
    out:string|string[];
}

interface Args
{
    templateDir:string;
    template?:string;
    invoke?:string;
    out?:string;
    dryRun?:boolean;
}

const args=parseCliArgsT<Args>({
    args:process.argv,
    startIndex:2,
    converter:{
        templateDir:args=>args[0]??'',
        template:args=>args[0],
        invoke:args=>args[0],
        out:args=>args[0],
        dryRun:args=>args.length?true:false,

    }
}).parsed as Args

if(!args.templateDir){
    throw new Error('--source-dir required');
}

const main=async ({
    templateDir,
    template,
    invoke,
    out:outArg,
    dryRun,
}:Args)=>{

    const files=await readdir(templateDir);

    await Promise.all(files.filter(f=>f.endsWith('.json')).map(async file=>{
        if(template && template.toLowerCase()+'.json'!==file.toLowerCase()){
            return;
        }
        try{
            const dirName=file.substring(0,file.length-'.json'.length);
            if(!files.some(f=>f===dirName)){
                return;
            }

            const fullDir=joinPaths(templateDir,dirName);
            const jsonPath=joinPaths(templateDir,file);

            const info=await stat(fullDir);
            if(!info.isDirectory()){
                return;
            }

            const {
                out:_out,
                ...options
            }:TemplateItem=JSON.parse((await readFile(jsonPath)).toString());

            const out=outArg??_out;

            if(invoke){
                options.bodyOnly=true;
            }

            options.sourceDir=fullDir;

            GenerateObjectFileSystemTemplateOptionsScheme.parse(options);

            if(options.recursive===undefined){
                options.recursive=true;
            }


            const output=await generateObjectFileSystemTemplateAsync(options);

            const outAry=asArray(out);
            for(const o of outAry){
                if(invoke){
                    await writeTmplAsync({
                        outDir:o,
                        files:evalTmplLines(output,invoke),
                        dryRun,
                    })
                }else{
                    if(!dryRun){
                        await writeFile(o,output.join('\n'));
                    }
                    console.log(`${fullDir} > ${o}`);
                }
            }

        }catch(ex){
            console.error(`Failed processing ${file}`,ex)
        }
    }))
}

main(args);
