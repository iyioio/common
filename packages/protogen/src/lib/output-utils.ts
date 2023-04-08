export const protoLabelOutputLines=(
    lines:string[],
    label:string,
    startIndex:number=0,
    end:number=lines.length)=>
{
    let maxLength=0;
    for(let i=startIndex;i<end;i++){
        if(lines[i].length>maxLength){
            maxLength=lines[i].length;
        }
    }

    maxLength+=4;
    for(let i=startIndex;i<end;i++){
        lines[i]+=' '.repeat(maxLength-lines[i].length)+'// <<';
        if(i===startIndex){
            lines[i]+=' proto '+label
        }
    }

}
