import { asArray, unrootPath } from "@iyio/common";
import { pathExistsAsync } from "@iyio/node-common";
import { ProtoContext, getProtoAutoDeleteDeps, protoMergeSourceCode, protoMergeTsImports } from "@iyio/protogen";
import { createReadStream } from "fs";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { createInterface } from 'readline';

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

    const checked:Record<string,boolean>={};
    await Promise.all(ctx.autoDeletePaths.map(async ad=>{

        const paths:string[]=[];
        await autoDeleteAsync(ctx,ad,paths,checked,ad.endsWith('/*'),true);
    }))

}

const autoDeleteAsync=async (ctx:ProtoContext,path:string,paths:string[],checked:Record<string,boolean>,recursive:boolean,first:boolean):Promise<void>=>{
    if(path.endsWith('/*')){
        path=path.substring(0,path.length-2);
    }
    if(checked[path]){
        return;
    }
    checked[path]=true;
    if(!await pathExistsAsync(path)){
        return;
    }
    const s=await stat(path);
    if(s.isDirectory()){
        if(!recursive && !first){
            return;
        }
        const items=await readdir(path);
        for(const item of items){
            await autoDeleteAsync(ctx,join(path,item),paths,checked,recursive,false);
        }
    }else if(s.size>20){
        const stream=createReadStream(path);
        const reader=createInterface(stream);
        const line=await new Promise<string>((r)=>{
            reader.on('line',line=>r(line));
        })
        reader.close();
        stream.close();

        const deps=getProtoAutoDeleteDeps(line);

        if(deps && !ctx.nodes.some(n=>deps.includes(n.name))){
            ctx.log(`delete - ${path}`);
            if(!ctx.dryRun){
                await unlink(path);
            }
        }
    }
}
