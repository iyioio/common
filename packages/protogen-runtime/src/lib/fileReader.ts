import { getFileExt, protocolReg } from "@iyio/common";
import { ProtoContext } from "@iyio/protogen";
import { readFile } from "fs/promises";

export const fileReader=async ({
    log,
    inputArgs,
    sources
}:ProtoContext)=>{
    for(const _input of inputArgs){
        const proto=protocolReg.exec(_input);
        if(proto && proto[1]?.toLowerCase()!=='file'){
            continue;
        }
        const input=proto?_input.substring("file://".length):_input;
        log(`fileReader - read ${input}`);

        const content=(await readFile(input)).toString();

        log(`${input} length - ${content.length}`);

        sources.push({
            input,
            ext:getFileExt(input,false,true),
            content,
        })

    }
}
