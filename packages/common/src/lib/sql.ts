export const escapeSqlString=(value:string)=>"'"+value.replace(/'/g,"''")+"'";
export const escapeSqlName=(value:string)=>'"'+value.replace(/"/g,'""')+'"';

export const sql=(strings:TemplateStringsArray,...values:any[])=>{

    if(strings.length===1){
        return strings[0].trim();
    }

    const strAry:string[]=[strings[0]];

    for(let i=1;i<strings.length;i++){
        strAry.push(escapeSqlValue(values[i-1]));
        strAry.push(strings[i]);
    }

    return strAry.join('').trim();
}

export const escapeSqlValue=(value:any):string=>{
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
            }else{
                return escapeSqlString(JSON.stringify(value).replace(/'/g,"''"));
            }

    }
}
