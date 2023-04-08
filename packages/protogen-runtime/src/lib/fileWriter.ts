import { unrootPath } from "@iyio/common";
import { pathExistsAsync } from "@iyio/node-common";
import { ProtoContext, protoMergeSourceCode } from "@iyio/protogen";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

export const fileWriter=async ({
    log,
    outputs,
}:ProtoContext)=>{

    for(const output of outputs){
        const name=unrootPath(output.path);
        if(!name){
            continue;
        }

        if(name.includes('/') || name.includes('\\')){
            const dirName=dirname(name);
            if(!await pathExistsAsync(dirName)){
                await mkdir(dirName,{recursive:true})
            }
        }

        if((output.autoMerge || output.mergeHandler!==undefined) && await pathExistsAsync(name)){
            const existing=(await readFile(name)).toString();

            const contentLines=output.content.split('\n');

            let mergedLines=(output.autoMerge?
                protoMergeSourceCode({existing,overwriting:contentLines}):
                existing.split('\n')
            )

            if(output.mergeHandler){
                mergedLines=await output.mergeHandler(mergedLines,contentLines);
            }

            const content=mergedLines.join('\n');
            log(`write merged - ${name} - ${content.length/1000}kb`);
            await writeFile(name,content);

        }else{
            log(`write - ${name} - ${output.content.length/1000}kb`);
            await writeFile(name,output.content);
        }
    }

}
