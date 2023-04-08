import { z } from "zod"
import { ProtoPipelineConfigurablePlugin, ProtoPipelinePlugin } from "./protogen-pipeline-types"

const TestPluginConfig=z.object({
    path:z.string().optional()
})
const TestPlugin:ProtoPipelineConfigurablePlugin<typeof TestPluginConfig>={
    configScheme:TestPluginConfig,
    init(ctx,{path}){
        console.log(path)
    }
}

TestPlugin.init?.(null as any,{path:'ok'},null as any)


const NoConfigPlugin:ProtoPipelinePlugin={
    init(ctx) {
        console.log(ctx);
    }
}

NoConfigPlugin.init?.(null as any,null,null as any);
