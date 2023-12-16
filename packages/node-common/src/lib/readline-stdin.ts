import { Interface, ReadLineOptions, createInterface } from "node:readline";

export type StdLineReadCallback=(line:string)=>void;

const buffer:string[]=[];
const callbackBuffer:StdLineReadCallback[]=[];


let rl:Interface|null=null;
export const startReadingStdIn=(options?:Partial<ReadLineOptions>)=>{
    if(rl){
        return;
    }
    rl=createInterface({
        input:process.stdin,
        output:process.stdout,
        terminal:true,
        ...options,
    });
    rl.on('line',line=>{
        if(callbackBuffer.length){
            const cb=callbackBuffer.shift();
            cb?.(line);
        }else{
            buffer.push(line);
        }
    })
}

export const stopReadingStdIn=()=>{
    const r=rl;
    if(r){
        rl=null;
        r.close();
    }
}

export const readStdInLineAsync=():Promise<string>=>{
    if(!rl){
        startReadingStdIn();
    }
    if(buffer.length){
        return Promise.resolve(buffer.shift()??'');
    }else{
        return new Promise<string>((r)=>{
            callbackBuffer.push(r);
        });
    }
}
export const readStdInLine=(callback:StdLineReadCallback):void=>{
    if(!rl){
        startReadingStdIn();
    }
    if(buffer.length){
        callback(buffer.shift()??'');
    }else{
        callbackBuffer.push(callback);
    }
}
