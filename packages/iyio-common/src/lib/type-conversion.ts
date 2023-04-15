export interface EnumArrayItem
{
    name:string;
    value:any;
}

export const enumToArray=(enumType:any):EnumArrayItem[]=>
{
    return Object.keys(enumType)
        .filter(k=>typeof enumType[k] === 'number')
        .map(k=>({name:k,value:enumType[k]}));
}
