import { asArray, unrootPath } from "@iyio/common";
import { pathExistsAsync } from "@iyio/node-common";
import { ProtoContext, protoMergeSourceCode, protoMergeTsImports } from "@iyio/protogen";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

export const fileWriter=async (ctx:ProtoContext)=>{

    const {
        log,
        outputs,
        writtenOutputs,
        dryRun,
    }=ctx;

    if(dryRun){
        log('### DRY RUN');
    }

    for(const output of outputs){
        const name=unrootPath(output.path);
        if(!name || writtenOutputs.includes(output)){
            continue;
        }

        writtenOutputs.push(output);

        if(name.includes('/') || name.includes('\\')){
            const dirName=dirname(name);
            if(!await pathExistsAsync(dirName)){
                if(!dryRun){
                    await mkdir(dirName,{recursive:true})
                }
            }
        }
        const exists=await pathExistsAsync(name);
        const existing=exists?(await readFile(name)).toString():'';

        if(output.generator){
            output.content=await output.generator.generator(ctx,output.generator,output,existing);
        }

        const mergers=output.mergeHandler?asArray(output.mergeHandler):null;

        const lp=output.path.toLowerCase();
        const isTs=lp.endsWith('.ts') || lp.endsWith('.tsx');

        if(exists && output.overwrite===false){
            continue;
        }else if((output.autoMerge || mergers) && exists && output.overwrite!==true){

            const contentLines=output.content.split('\n');

            let mergedLines=existing.split('\n');


            if(isTs && !output.raw){
                mergedLines=protoMergeTsImports({existing:mergedLines,overwriting:contentLines});
            }

            if(output.autoMerge){
                mergedLines=protoMergeSourceCode({existing:mergedLines,overwriting:contentLines});
            }

            if(mergers?.length){
                for(const merger of mergers){
                    if(merger){
                        mergedLines=merger({existing:mergedLines,overwriting:contentLines});
                    }
                }
            }


            let content=mergedLines.join('\n');
            if(!output.raw){
                content=content.trim()+'\n';
            }
            log(`write merged - ${name} - ${content.length/1000}kb`);
            if(!dryRun){
                await writeFile(name,content);
            }

        }else{
            const contentLines=output.content.split('\n');
            let mergedLines=contentLines;

            if(isTs && !output.raw){
                mergedLines=protoMergeTsImports({existing:mergedLines,overwriting:contentLines,force:true});
            }

            if(mergers?.length){

                for(const merger of mergers){
                    if(merger){
                        mergedLines=merger({existing:mergedLines,overwriting:contentLines});
                    }
                }
            }

            let content=mergedLines.join('\n');

            if(!output.raw){
                content=content.trim()+'\n';
            }
            log(`write - ${name} - ${content.length/1000}kb`);
            if(!dryRun){;

                await writeFile(name,content);
            }
        }
    }

}
