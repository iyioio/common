import { ProtoPipelinePlugin } from "@iyio/protogen";


export const tsExternalExecutor:ProtoPipelinePlugin={

    // beforeAll:async (ctx)=>{
    //     //
    // },
    // stage:async (ctx)=>{

    //     const {
    //         stage
    //     }=ctx;

    //     const dir='./.protogen';
    //     const path=getFullPath(join(dir,'.ctx-'+ctx.executionId+'.json'));

    //     if(action==='clean-up'){
    //         if(await pathExistsAsync(path)){
    //             await rm(path);
    //         }
    //         return;
    //     }

    //     if(!plugin){
    //         return;
    //     }

    //     const [pluginPath,_tsConfigPath]=plugin.split(':');

    //     const tsConfigPath=_tsConfigPath??ctx.args['--ts-config'];


    //     if(!pathExistsAsync(pluginPath)){
    //         return;
    //     }

    //     const pluginMeta=ctx.metadata['plugin-'+plugin];
    //     if(pluginMeta && !pluginMeta[ctx.stage]){
    //         return;
    //     }


    //     if(!await pathExistsAsync(dir)){
    //         await mkdir(dir);
    //     }

    //     await writeFile(path,JSON.stringify(ctx,null,4));

    //     process.env['PROTOGEN_CONTEXT_PATH']=path;
    //     process.env['NX_PROTOGEN_CONTEXT_PATH']=path;
    //     process.env['PROTOGEN_CURRENT_PLUGIN']=plugin;
    //     process.env['NX_PROTOGEN_CURRENT_PLUGIN']=plugin;

    //     await execAsync({
    //         cmd:`npx ts-node${tsConfigPath?` -r tsconfig-paths/register --project ${tsConfigPath}`:''} ${pluginPath}`,
    //         out:ctx.log
    //     });

    //     const json=JSON.parse((await readFile(path)).toString());
    //     const log=ctx.log;
    //     for(const e in ctx){
    //         delete (ctx as any)[e];
    //     }
    //     for(const e in json){
    //         (ctx as any)[e]=json[e];
    //     }
    //     ctx.log=log;

    // },
    // afterAll:(ctx)=>{
    //     //
    // }
}
