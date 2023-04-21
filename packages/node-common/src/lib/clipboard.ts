import { spawn } from "node:child_process";

export const nodeCopyToClipboard=(data:string)=>{
    const proc=spawn('pbcopy');
    proc.stdin.write(data);
    proc.stdin.end();
}
