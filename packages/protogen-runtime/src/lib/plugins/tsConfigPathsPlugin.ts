import { pathExistsAsync } from "@iyio/node-common";
import { ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { readFile, writeFile } from "fs/promises";
import { z } from "zod";

const TsConfigPluginConfig=z.object(
{
    /**
     * @default "tsconfig.json"
     */
    tsConfigPath:z.string().optional(),
})

export const tsConfigPlugin:ProtoPipelineConfigurablePlugin<typeof TsConfigPluginConfig>=
{
    configScheme:TsConfigPluginConfig,
    output:async ({
        packagePaths,
        log,
        dryRun
    },{
        tsConfigPath='tsconfig.json',
    })=>{

        if(dryRun){
            log('### DRY RUN');
        }

        if(!pathExistsAsync(tsConfigPath)){
            throw new Error(`tsconfig not found at ${tsConfigPath}`)
        }

        const config=JSON.parse((await readFile(tsConfigPath)).toString());

        if(!config.compilerOptions){
            config.compilerOptions={};
        }

        if(!config.compilerOptions.paths){
            config.compilerOptions.paths={}
        }

        const tsPaths=config.compilerOptions.paths;
        let added=false;
        for(const pkg in packagePaths){
            const paths=packagePaths[pkg];
            if(!paths){
                continue;
            }
            for(const path of paths){
                added=true;
                log(`${pkg} > ${path}`);

                let ary:string[]=tsPaths[pkg];
                if(!ary){
                    tsPaths[pkg]=ary=[];
                }
                if(!ary.includes(path)){
                    ary.push(path);
                }
            }
        }

        log(`write merged - ${tsConfigPath}`);
        if(added && !dryRun){
            await writeFile(tsConfigPath,JSON.stringify(config,null,4));
        }

    }
}
