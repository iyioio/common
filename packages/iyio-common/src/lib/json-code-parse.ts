import { CodeParser } from "./code-parsing-types";
import { getErrorMessage } from "./error-lib";

export const parseJsonCode:CodeParser<any>=(code,options)=>{
    const startIndex=options?.startIndex??0;
    if(startIndex){
        code=code.substring(startIndex);
    }
    try{
        const result=JSON.parse(code);
        return {result,endIndex:code.length+startIndex}
    }catch(ex){
        const msg=ex?.toString();
        const message=getErrorMessage(ex);
        const lines=code.split('\n');
        let index:number=code.length;
        let lineNumber:number=lines.length;
        let col:number=1;
        let line:string='';
        let near:string='';

        const match=/line\s*(\d+)\s*column\s*(\d+)/.exec(msg??'');
        if(match){
            index=0;
            lineNumber=Number(match[1]);
            col=Number(match[2]);
            line=lines[lineNumber-1]??'';
            near=line;
            for(let li=1;li<lineNumber;li++){
                index+=(lines[li-1]??'').length+1;
            }
            index+=col;
        }

        return {
            endIndex:index+startIndex,
            error:{
                message,
                index:index+startIndex,
                line,
                lineNumber,
                col,
                near
            }
        }
    }
}
