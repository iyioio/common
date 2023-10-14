
export interface AcComp
{
    id:string;
    name:string;
    path:string;
    propType:string;
    props:AcProp[];
    comp?:string|((props:Record<string,any>,placeholder?:any)=>any);
    isDefaultExport?:boolean;
}

export type AcType="string"|"number"|"bigint"|"boolean"|"symbol"|"undefined"|"object"|"function";
export interface AcProp{
    name:string;
    optional:boolean;
    defaultType:AcTypeDef;
    types:AcTypeDef[];
    sig:string;
}

export interface AcTypeDef
{
    type:AcType;
    subTypes?:AcTypeDef[];
}

export interface AcCompRegistry
{
    comps:AcComp[];
}
