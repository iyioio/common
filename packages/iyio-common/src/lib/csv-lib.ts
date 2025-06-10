import { Csv, CsvRow } from "./csv-types";
import { getValueByPath } from "./object";

export const toCsv=(rows:any[],maxDepth=2,head?:string[]):string=>{
    return toCsvLines(rows,maxDepth,head).join('\n');
}

export const parseCsv=(content:string):Csv=>{
    const rows:CsvRow[]=[];

    const lines=content.trim().split('\n');

    const header=splitCsvLine(lines[0]??'').map(h=>h.trim())??[];
    for(let i=1;i<lines.length;i++){
        const line=splitCsvLine(lines[i] as string);
        if(line.length===1 && !line[0]?.trim()){
            continue;
        }
        const row:CsvRow={}
        rows.push(row);
        for(let c=0;c<line.length;c++){
            const col=header[c]??'_'+i;
            row[col]=line[c] as string;
        }
        for(const h of header){
            if(!row[h]){
                row[h]='';
            }
        }
    }

    return {
        header,
        rows,
    }
}

export const parseCsvRows=(content:string):CsvRow[]=>parseCsv(content).rows;

export const splitCsvLine=(line:string):string[]=>{
    const row:string[]=[];

    let i=0;
    let value='';
    let firstChar=true;
    let inEscape=false;
    for(;i<line.length;i++){
        const ch=line.charAt(i);

        if(firstChar){
            inEscape=ch==='"';
            firstChar=false;
            if(inEscape){
                continue;
            }
        }

        if(inEscape){
            if(ch==='"'){
                if(line.charAt(i+1)==='"'){
                    value+='"';
                    i++
                }else{
                    inEscape=false;
                }
            }else{
                value+=ch;
            }
        }else if(ch===','){
            row.push(sanitizeValue(value.trim()));
            value='';
            firstChar=true;
        }else{
            value+=ch;
        }

    }

    row.push(sanitizeValue(value.trim()));

    return row;
}

const lineSep='\u2028';
const remove=/\u200b/g;
const sanitizeValue=(value:string):string=>{
    if(value.includes(lineSep)){
        return value.split(lineSep).join('\n').replace(remove,'')
    }else{
        return value.replace(remove,'');
    }
}

export const escapeCsvValue=(value:any):string=>{
    if(value===null){
        return 'null';
    }else if(value===undefined){
        return '';
    }else if(typeof value === 'object'){
        try{
            value=JSON.stringify(value);
        }catch{
            try{
                value=value.toString()??'';
            }catch{
                value='[object]';
            }
        }
    }else{
        try{
            value=value.toString()??'';
        }catch{
            value='[value]';
        }
    }

    value=(value as string).replace(/[\n\r]/g,v=>v==='\n'?'\\n':'\\r');

    if((value as string).includes("\"")){
        value=(value as string).replace(/"/g, '""');
    }
    if( (value as string).includes(",") ||
        (value as string).includes("'") ||
        (value as string).includes("\\") ||
        (value as string).includes("\"")
    ){
        value=`"${value}"`;
    }

    return value;
}

export const toCsvLines=<T>(values:T[],maxDepth=2,head?:string[]):string[]=>{

    if(!head){
        head=getDotHeadAll(values,maxDepth);
    }

    const lines:string[]=[];

    const line:string[]=[];

    for(let vi=0;vi<values.length;vi++){
        const v=values[vi];
        if(!v){
            continue;
        }
        for(let c=0;c<head.length;c++){
            const col=head[c]??'';
            line.push(escapeCsvValue(getValueByPath(v,col)));
        }
        lines.push(line.join(','));
        line.splice(0,line.length);
    }

    for(let c=0;c<head.length;c++){
        head[c]=escapeCsvValue(head[c??'']?.replace(/\./g,'_'));
    }
    lines.unshift(head.join(','));

    return lines;
}

const getDotHeadAll=(ary:any[],maxDepth:number):string[]=>{
    const head:string[]=[];
    for(const item of ary){
        if(item && (typeof item === 'object')){
            getDotHead(item,maxDepth,'',head);
        }
    }
    return head;
}
const getDotHead=(obj:any,maxDepth:number,prefix='',head:string[]=[]):string[]=>{
    if(!obj || maxDepth<0){
        return head;
    }

    for(const e in obj){
        const key=prefix+e;

        const value=obj[e];
        if(value && maxDepth && (typeof value==='object')){
            getDotHead(value,maxDepth-1,key+'.',head);
        }else if(!head.includes(key)){
            head.push(key);
        }
    }

    return head;
}
