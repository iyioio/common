import { Csv, CsvRow } from "./csv-types";

export const parseCsv=(content:string):Csv=>{
    const rows:CsvRow[]=[];

    const lines=content.trim().split('\n');

    const header=splitCsvLine(lines[0]??'').map(h=>h.trim())??[];
    for(let i=1;i<lines.length;i++){
        const line=splitCsvLine(lines[i] as string);
        if(!line[0]){
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
