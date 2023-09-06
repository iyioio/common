import { getDirectoryName } from "@iyio/common";
import { protoGenerateTsIndex, ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { nxLibraryTemplate } from "./nxLibraryTemplate";

const AutoPackageIndexPluginConfig=z.object(
{
    /**
     * List of index file paths to ignore
     */
    autoPackageIndexIgnore:z.string().array().optional(),

})

export const autoPackageIndexPlugin:ProtoPipelineConfigurablePlugin<typeof AutoPackageIndexPluginConfig>=
{
    configScheme:AutoPackageIndexPluginConfig,

    setGenerationStage:(context,plugins)=>{
        let s=0;
        for(const p of plugins){
            if((p.plugin.generationStage??0)>s){
                s=p.plugin.generationStage??0;
            }
        }
        return s;
    },

    generate:async ({
        outputs,
        packagePaths,
        autoIndexPackages,
        libStyle,
    },{
        autoPackageIndexIgnore=[],
    })=>{

        if(!autoIndexPackages){
            return;
        }

        for(const packageName in packagePaths){
            const ary=packagePaths[packageName];

            for(const path of ary){

                if(autoPackageIndexIgnore.includes(path)){
                    continue;
                }

                outputs.push({
                    path,
                    content:'',
                    isPackageIndex:true,
                    isAutoPackageIndex:true,
                    generator:{
                        root:getDirectoryName(path),
                        recursive:true,
                        generator:protoGenerateTsIndex
                    }
                });

                if(libStyle==="nx"){
                    outputs.push(...nxLibraryTemplate({
                        path:getDirectoryName(getDirectoryName(path)),
                        packageName:packageName
                    }))
                }

            }
        }
    }
}
