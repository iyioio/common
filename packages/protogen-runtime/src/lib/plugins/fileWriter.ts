import { asArray, unrootPath } from "@iyio/common";
import { pathExistsAsync } from "@iyio/node-common";
import { ProtoContext, protoMergeSourceCode, protoMergeTsImports } from "@iyio/protogen";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

export const fileWriter=async (ctx:ProtoContext)=>{

    const {
        log,
        outputs,
        dryRun,
    }=ctx;

    if(dryRun){
        log('### DRY RUN');
    }

    for(const output of outputs){
        const name=unrootPath(output.path);
        if(!name){
            continue;
        }

        if(name.includes('/') || name.includes('\\')){
            const dirName=dirname(name);
            if(!await pathExistsAsync(dirName)){
                if(!dryRun){
                    await mkdir(dirName,{recursive:true})
                }
            }
        }

        if(output.generator){
            output.content=await output.generator.generator(ctx,output.generator,output);
        }

        const mergers=output.mergeHandler?asArray(output.mergeHandler):null;

        const exists=await pathExistsAsync(name);

        if(exists && output.overwrite===false){
            continue;
        }else if((output.autoMerge || mergers) && exists){
            const existing=(await readFile(name)).toString();

            const contentLines=output.content.split('\n');

            protoMergeTsImports({existing,overwriting:contentLines})

            let mergedLines=(output.autoMerge?
                protoMergeSourceCode({existing,overwriting:contentLines}):
                contentLines
            )

            if(mergers?.length){
                for(const merger of mergers){
                    if(merger){
                        mergedLines=merger({existing:mergedLines,overwriting:contentLines});
                    }
                }
            }


            const content=mergedLines.join('\n');
            log(`write merged - ${name} - ${content.length/1000}kb`);
            if(!dryRun){
                await writeFile(name,content);
            }

        }else{
            let content=output.content;
            if(mergers?.length){
                const contentLines=content.split('\n');
                let mergedLines=contentLines;

                for(const merger of mergers){
                    if(merger){
                        mergedLines=merger({existing:mergedLines,overwriting:contentLines});
                    }
                }
                content=mergedLines.join('\n');
            }
            log(`write - ${name} - ${content.length/1000}kb`);
            if(!dryRun){;

                await writeFile(name,content);
            }
        }
    }

}
