export const compObjTypeKey='[[!co.type]]'

export interface CompObj
{
    [compObjTypeKey]:string;
    props?:CompObjProps;
}

export interface CompObjProps
{
    children?:CompObj|any|(CompObj|any)[];
    [prop:string]:any;
}

export const isCompObj=(value:any):value is CompObj=>typeof value?.[compObjTypeKey] === 'string';

export type ComObJsxRenderer=(type:any,props:Record<string,any>)=>any;

export interface CompObjRenderOptions
{
    /**
     * If true components starting with a lowercase will be looked up instead of being passed to
     * the renderer.
     */
    includeLower?:boolean;
    compReg?:Record<string,any>;
    compLookup?:(type:string)=>any;
}
