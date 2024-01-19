import { CodeParsingError } from "./code-parsing-types";

export const getCodeParsingError=(code:string,index:number,message:string):CodeParsingError=>{

    let lineNumber=1;
    for(let i=0;i<=index;i++){
        if(code[i]==='\n'){
            lineNumber++;
        }
    }

    const s=Math.max(0,code.lastIndexOf('\n',index));
    let e=code.indexOf('\n',index);
    if(e===-1){
        e=code.length;
    }

    const neg=Math.min(index,10);

    return {
        message,
        index,
        lineNumber,
        line:code.substring(s,e).trim(),
        col:index-s,
        near:(
            code
            .substring(index-10,index+20)
            .replace(/[\n]/g,'↩︎').replace(/[\s]/g,'•')
            +'\n'+' '.repeat(neg)+'^'
        ),
    }
}

export const getLineNumber=(code:string,stopIndex=code.length-1)=>{
    let lineNumber=1;
    for(let i=0;i<=stopIndex;i++){
        if(code[i]==='\n'){
            lineNumber++;
        }
    }
    return lineNumber;
}
