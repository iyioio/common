import { protocolReg } from "@iyio/common";
import { writeFile } from "fs/promises";
import { ProtoContext } from "./protogen-types";

export const fileWriter=async ({
    log,
    outputArgs,
    outputs,
}:ProtoContext)=>{

    for(const _dest of outputArgs){
        const proto=protocolReg.exec(_dest);
        if(proto && proto[1]?.toLowerCase()!=='file'){
            continue;
        }
        const dest=proto?_dest.substring("file://".length):_dest;
        log(`fileWriter - dest ${dest}`);

        for(const output of outputs){
            const name=output.name??_dest;

            log(`fileWriter - dest ${dest}, name ${name}`);
            await writeFile(name,output.content);
        }

    }
}
