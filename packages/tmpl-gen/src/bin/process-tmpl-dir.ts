import { asArray, joinPaths, parseCliArgsT } from "@iyio/common";
import { readFile, readdir, stat, writeFile } from "fs/promises";
import { GenerateObjectFileSystemTemplateOptions, GenerateObjectFileSystemTemplateOptionsScheme, generateObjectFileSystemTemplateAsync } from "../lib/templateGenerator";

interface TemplateItem extends Omit<GenerateObjectFileSystemTemplateOptions,'output'>
{
    out:string|string[];
}

interface Args
{
    templateDir:string;
}

const args=parseCliArgsT<Args>({
    args:process.argv,
    startIndex:2,
    converter:{
        templateDir:args=>args[0],

    }
}).parsed as Args

if(!args.templateDir){
    throw new Error('--source-dir required');
}

const main=async ({
    templateDir
}:Args)=>{

    const files=await readdir(templateDir);

    await Promise.all(files.filter(f=>f.endsWith('.json')).map(async file=>{
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
                out,
                ...options
            }:TemplateItem=JSON.parse((await readFile(jsonPath)).toString());

            options.sourceDir=fullDir;

            GenerateObjectFileSystemTemplateOptionsScheme.parse(options);

            if(options.recursive===undefined){
                options.recursive=true;
            }


            const output=(await generateObjectFileSystemTemplateAsync(options)).join('\n');

            const outAry=asArray(out);
            for(const o of outAry){
                await writeFile(o,output);
                console.log(`${fullDir} > ${o}`)
            }

        }catch(ex){
            console.error(`Failed processing ${file}`,ex)
        }
    }))
}

main(args);
