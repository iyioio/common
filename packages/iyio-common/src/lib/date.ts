export const safeParseDateOrUndefined=(value:any):Date|undefined=>{
    if(value instanceof Date){
        return value;
    }
    let date:Date|null=null;
    const type=typeof value;
    if(type==='string' || type==='number'){
        date=new Date(value);
    }
    if(!date || isNaN(date.getTime())){
        return undefined;
    }else{
        return date;
    }
}

export const safeParseDate=(value:any,defaultValue:number|string|Date):Date=>{
    let date=safeParseDateOrUndefined(value);
    if(date===undefined){
        date=safeParseDateOrUndefined(defaultValue);
        if(date===undefined){
            throw new Error('Invalid default date value passed to safeParseDate. value='+defaultValue);
        }
    }
    return date;
}
