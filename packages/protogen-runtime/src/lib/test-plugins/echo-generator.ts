import { chmod, writeFile } from "fs/promises";
import { executeProtoPluginAsync } from "../protogen-runtime";

executeProtoPluginAsync({
    generate:async ctx=>{
        const cmd=ctx.nodes.map(n=>`echo ${n.name}`).join('\n')+'\n';
        await writeFile('./echo-nodes.sh',cmd);
        await chmod('./echo-nodes.sh',511);
        console.log('./echo-nodes.sh created')
    }
})
