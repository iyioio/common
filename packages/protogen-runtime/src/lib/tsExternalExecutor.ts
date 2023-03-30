import { execAsync, getFullPath, pathExistsAsync } from "@iyio/node-common";
import { ProtoExternalExecutor } from "@iyio/protogen";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";

export const tsExternalExecutor:ProtoExternalExecutor=async (ctx,{plugin,action})=>{

    const dir='./.protogen';
    const path=getFullPath(join(dir,'.ctx-'+ctx.executionId+'.json'));

    if(action==='clean-up'){
        if(await pathExistsAsync(path)){
            await rm(path);
        }
        return true;
    }

    if(!plugin){
        return true;
    }

    const [pluginPath,_tsConfigPath]=plugin.split(':');

    const tsConfigPath=_tsConfigPath??ctx.args['--ts-config'];


    if(!pathExistsAsync(pluginPath)){
        return false;
    }

    const pluginMeta=ctx.metadata['plugin-'+plugin];
    if(pluginMeta && !pluginMeta[ctx.stage]){
        return true;
    }


    if(!await pathExistsAsync(dir)){
        await mkdir(dir);
    }

    await writeFile(path,JSON.stringify(ctx,null,4));

    process.env['PROTOGEN_CONTEXT_PATH']=path;
    process.env['NX_PROTOGEN_CONTEXT_PATH']=path;
    process.env['PROTOGEN_CURRENT_PLUGIN']=plugin;
    process.env['NX_PROTOGEN_CURRENT_PLUGIN']=plugin;

    await execAsync(`npx ts-node${tsConfigPath?` -r tsconfig-paths/register --project ${tsConfigPath}`:''} ${pluginPath}`);

    const json=JSON.parse((await readFile(path)).toString());
    const log=ctx.log;
    for(const e in ctx){
        delete (ctx as any)[e];
    }
    for(const e in json){
        (ctx as any)[e]=json[e];
    }
    ctx.log=log;

    return true;

}
