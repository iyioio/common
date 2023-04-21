import { parseCliArgsT } from "@iyio/common";
import { nodeCopyToClipboard } from "@iyio/node-common";
import { writeFile } from "fs/promises";
import { GenerateObjectFileSystemTemplateOptions, generateObjectFileSystemTemplateAsync } from "../lib/templateGenerator";

interface Args extends Omit<GenerateObjectFileSystemTemplateOptions,'output'>
{
    copyToClipboard?:boolean;
    out?:string;
}

const args=parseCliArgsT<Args>({
    args:process.argv,
    startIndex:2,
    converter:{
        sourceDir:args=>args[0],
        baseName:args=>args[0],
        ignore:args=>args,
        recursive:args=>args.length===0 || Boolean(args[0]??'false'),
        copyToClipboard:args=>args.length===0 || Boolean(args[0]??'false'),
        bodyOnly:args=>args.length===0 || Boolean(args[0]??'false'),
        name:args=>args[0],
        transformer:args=>args[0],
        transformerParam:args=>args[0],
        out:args=>args[0],

    }
}).parsed as Args

if(!args.sourceDir){
    throw new Error('--source-dir required');
}

const main=async ({
    out,
    copyToClipboard,
    ...args
}:Args)=>{

    const output:string[]=await generateObjectFileSystemTemplateAsync(args)

    const outString=output.join('\n');
    console.log(outString);

    if(copyToClipboard){
        nodeCopyToClipboard(outString);
        console.log('Output copied to clipboard');
    }
    if(out){
        await writeFile(out,outString);
        console.log(`Output written to ${out}`)
    }
}

main(args);
