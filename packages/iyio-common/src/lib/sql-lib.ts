import { DataTableColInfo } from "./data-table";
import { safeParseNumber } from "./numbers";

const jsonPathReg=/^(\w+)\.([^:]+):(\w+)$/;
const castTypes=[
    'json','jsonb','boolean','text','int',
    'json[]','jsonb[]','boolean[]','text[]','int[]',
]

export const escapeSqlString=(value:string)=>"'"+value.replace(/'/g,"''")+"'";
export const escapeSqlName=(value:string)=>{
    if(value.includes(':')){
        const jMatch=jsonPathReg.exec(value);

        if(jMatch){
            const type=jMatch[3] as string;
            if(!castTypes.includes(type)){
                throw new Error('Invalid JSON path expression - '+value);
            }
            const parts=(jMatch[2] as string).split('.').map(v=>escapeSqlString(v));
            return `("${(jMatch[1] as string).replace(/`/g,'""')}"->>${parts.join('->>')})::${type}`;
        }
    }
    return '"'+value.replace(/"/g,'""')+'"'
}

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

export const sqlIn=(value:any[]):EscapedSqlValue=>{
    return rawSqlValue(_escapeSqlValue(value,true,0,undefined,{inConditionValue:true}))
}

export const rawSqlValue=(value:string):EscapedSqlValue=>{
    return {
        value,
        [isEscaped]:true,
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

    return strAry.join('');
}


export interface SqlEscapeValueOptions
{
    inConditionValue?:boolean;
}
const _escapeSqlValue=(value:any,wrapArray:boolean,depth:number,colInfo?:DataTableColInfo,options?:SqlEscapeValueOptions,altString=false):string=>{
    if(depth>50){
        throw new Error('Max escapeSqlValue depth reached');
    }
    if(colInfo?.sqlType==='json'){
        return escapeSqlString(JSON.stringify(value));
    }
    switch(typeof value){

        case 'string':
            return altString?escapeSqlName(value):escapeSqlString(value);

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
                if(colInfo?.sqlType==='vector'){
                    let changed=false;
                    for(let i=0;i<value.length;i++){
                        const v=value[i];
                        if((typeof v !== 'number') && (typeof v !== 'bigint')){
                            if(!changed){
                                value=[...value];
                                changed=true;
                            }
                            value[i]=safeParseNumber(v,0);
                        }

                    }
                    return `'${JSON.stringify(value)}'`
                }
                return (
                    (options?.inConditionValue?'(':wrapArray?'\'{':'')+
                    value.map(v=>_escapeSqlValue(v,wrapArray,depth+1,colInfo,{...options,inConditionValue:false},options?.inConditionValue?false:true)).join(',')+
                    (options?.inConditionValue?')':wrapArray?'}\'':'')
                );
            }else{
                return escapeSqlString(JSON.stringify(value));
            }

    }
}


export const escapeSqlValue=(value:any,colInfo?:DataTableColInfo,wrapArray=true):string=>_escapeSqlValue(value,wrapArray,0,colInfo);

export const splitSqlStatements=(statements:string):string[]=>{
    const split:string[]=[];
    let inside:'"'|"'"|'-'|null=null;
    let s=0;
    for(let i=0;i<statements.length;i++){
        const char=statements[i] as string;

        if(inside){
            if(inside==='-'){
                if(char==='\n'){
                    inside=null;
                    s=i+1;
                }
            }else if(char===inside){
                if(statements[i+1]===inside){
                    i++;
                }else{
                    inside=null;
                }
            }
        }else if(char==='"'){
            inside='"';
        }else if(char==="'"){
            inside="'";
        }else if(char==='-' && statements[i+1]==='-'){
            const v=statements.substring(s,i).trim();
            if(v){
                split.push(v);
            }
            inside='-';
            i++
        }else if(char===';'){
            const v=statements.substring(s,i).trim();
            if(v){
                split.push(v);
            }
            s=i+1;
        }
    }
    if(s!==statements.length-1 && inside!=='-'){
        const v=statements.substring(s).trim();
        if(v){
            split.push(v);
        }
    }
    return split;
}

export const escapeSqlLikeValue=(value:string)=>{
    return value.replace(/[%_\\]/g,v=>'\\'+v);
}

export const starStringToSqlLikeValue=(value:string)=>{
    return value.replace(/[*%_\\]/g,v=>v==='*'?'%':'\\'+v);
}
