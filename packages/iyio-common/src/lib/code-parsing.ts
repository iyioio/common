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

export const getLineIndentation=(code:string,startIndex=0):number=>{
    for(let i=startIndex;i<code.length;i++){
        if(code[i]!==' '){
            return i-startIndex;
        }
    }
    return 0;
}

export interface SetIndentationOptions
{
    useBaseFromFirstNonZero?:boolean;
    noTrim?:boolean;
}
export const setIndentation=(indent:number,code:string,{
    useBaseFromFirstNonZero=false,
    noTrim=false
}:SetIndentationOptions={}):string=>{


    const lines:string[]=code.split('\n');

    if(!noTrim){
        while(lines.length && spReg.test(lines[0] as string)){
            lines.shift();
        }
        while(lines.length && spReg.test(lines[lines.length-1] as string)){
            lines.pop();
        }
    }

    let baseInd:number;
    let alignStart=0;
    if(useBaseFromFirstNonZero){
        baseInd=0;
        for(let i=0;i<lines.length;i++){
            baseInd=getLineIndentation(lines[i] as string);
            if(baseInd){
                alignStart=i;
                break;
            }
        }
    }else{
        baseInd=getLineIndentation(lines[0]??'');
    }

    const indSp=' '.repeat(indent);
    const negIndent=-indent;

    for(let i=0;i<lines.length;i++){
        let line=lines[i] as string;
        const ind=getLineIndentation(line);

        if(ind){
            line=line.substring(ind);
        }


        if(ind<baseInd && i<alignStart){
            lines[i]=indSp+line;
            continue;
        }

        const diff=ind-baseInd;
        if(diff<negIndent){
            lines[i]=line;

        }else{
            lines[i]=' '.repeat(indent+diff)+line;
        }

    }

    return lines.join('\n');


}

const spReg=/^\s*$/;

const emptyReg=/^[ \r\t]*$/;
/**
 * Removes all empty lines start from the given index until a non empty line is found
 * @param code The code to remove empty lines from
 * @param index The position in the code to remove empty lines from
 * @param autoMoveBackLine If true and the character at index is an newline character index will
 *                         be moved back one character. Is true by default
 * @returns The code with empty lines removed
 */
export const removeEmptyLinesAtIndex=(code:string,index:number,autoMoveBackLine=true):string=>{

    if(code[index]==='\n' && autoMoveBackLine){
        if(index===0){
            return code;
        }
        index--;
    }

    index=code.lastIndexOf('\n',index);
    let end=code.indexOf('\n',index);
    if(end===-1){
        end=code.length;
    }

    if(!emptyReg.test(code.substring(index,end))){
        return code;
    }

    //remove starting newline and keep ending
    code=(index===-1?'':code.substring(0,index))+code.substring(end);

    index++;
    while(index<code.length-1){
        end=code.indexOf('\n',index);
        if(end===-1){
            end=code.length;
        }
        if(!emptyReg.test(code.substring(index,end))){
            break;
        }
        const len=code.length;
        code=code.substring(0,index)+code.substring(end+1);

        if(len===code.length){
            break;
        }
    }

    return code;
}
