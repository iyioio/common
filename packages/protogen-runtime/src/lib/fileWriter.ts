import { pathExistsAsync } from "@iyio/node-common";
import { ProtoContext } from "@iyio/protogen";
import { mkdir, writeFile } from "fs/promises";
import { dirname } from "path";

export const fileWriter=async ({
    log,
    outputs,
}:ProtoContext)=>{

    for(const output of outputs){
        const name=output.path;

        if(name.includes('/') || name.includes('\\')){
            const dirName=dirname(name);
            if(!await pathExistsAsync(dirName)){
                await mkdir(dirName,{recursive:true})
            }
        }

        log(`write - ${name} - ${output.content.length/1000}kb`);
        await writeFile(name,output.content);
    }

}
