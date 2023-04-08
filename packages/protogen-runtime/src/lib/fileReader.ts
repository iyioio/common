import { getFileExt, protocolReg } from "@iyio/common";
import { ProtoContext } from "@iyio/protogen";
import { readFile } from "fs/promises";


export const fileReader=async ({
    log,
    inputs,
    sources
}:ProtoContext)=>{
    for(const _input of inputs){
        const proto=protocolReg.exec(_input);
        if(proto && proto[1]?.toLowerCase()!=='file'){
            continue;
        }
        const input=proto?_input.substring("file://".length):_input;
        log(`read - ${input}`);

        const content=(await readFile(input)).toString();

        log(`${input} - ${content.length/1000}kb`);

        sources.push({
            input,
            ext:getFileExt(input,false,true),
            content,
        })

    }
}
