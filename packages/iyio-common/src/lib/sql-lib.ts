
export const escapeSqlString=(value:string)=>"'"+value.replace(/'/g,"''")+"'";
export const escapeSqlName=(value:string)=>'"'+value.replace(/"/g,'""')+'"';

const isEscaped=Symbol('isEscaped');

export interface EscapedSqlValue
{
    value:string;
    [isEscaped]:true;
}

export const isEscapedSqlValue=(value:any):value is EscapedSqlValue=>{
    if(!value){
        return false;
    }
    return (
        ((value as Partial<EscapedSqlValue>)?.[isEscaped] === true ) &&
        (typeof (value as Partial<EscapedSqlValue>)?.value === 'string' )
    )
}

export const sqlName=(name:string):EscapedSqlValue=>{
    return {
        value:escapeSqlName(name),
        [isEscaped]:true
    }
}

export const sql=(strings:TemplateStringsArray,...values:any[])=>{

    if(strings.length===1){
        return (strings[0] as string).trim();
    }

    const strAry:string[]=[(strings[0] as string)];

    for(let i=1;i<strings.length;i++){

        const v=values[i-1];
        if(isEscapedSqlValue(v)){
            strAry.push(v.value);
        }else if(v && v.name!==undefined){
            strAry.push(escapeSqlName(v.name));
        }else{
            strAry.push(escapeSqlValue(v));
        }


        strAry.push(strings[i] as string);
    }

    return strAry.join('').trim();
}

const _escapeSqlValue=(value:any,wrapArray:boolean,depth:number):string=>{
    if(depth>20){
        throw new Error('Max escapeSqlValue depth reached');
    }
    switch(typeof value){

        case 'string':
            return escapeSqlString(value);

        case 'number':
        case 'bigint':
            return value.toString();

        case 'boolean':
            return value?'TRUE':'FALSE';

        default:
            if(value===null || value===undefined){
                return 'NULL';
            }else if(value instanceof Date){
                return `'${value.toISOString()}'`;
            }else if(Array.isArray(value)){
                return (wrapArray?'(':'')+value.map(v=>_escapeSqlValue(v,wrapArray,depth+1)).join(',')+(wrapArray?')':'');
            }else{
                return escapeSqlString(JSON.stringify(value).replace(/'/g,"''"));
            }

    }
}


export const escapeSqlValue=(value:any,wrapArray=true):string=>_escapeSqlValue(value,wrapArray,0);
