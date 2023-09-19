export type JsonSchemeType='string'|'number'|'integer'|'object'|'array'|'boolean'|'null';

export interface JsonScheme
{
    type?:JsonSchemeType;
    enum?:any[];
    description?:string;
    required?:string[];
    properties?:Record<string,JsonScheme>;
    /**
     * Used with type array and indicates the types of items
     */
    items?:JsonScheme|false;
}
