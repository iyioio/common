
export interface AcComp
{
    id:string;
    name:string;
    path:string;
    propType:string;
    props:AcProp[];
    comp?:string|((props:Record<string,any>,placeholder?:any)=>any)|null;
    isDefaultExport?:boolean;
    comment?:string;
    tags?:Record<string,string>;
}

export type AcType="string"|"number"|"bigint"|"boolean"|"symbol"|"undefined"|"object"|"function";
export interface AcProp{
    name:string;
    optional:boolean;
    defaultType:AcTypeDef;
    types:AcTypeDef[];
    sig:string;
    defaultValueText?:string;
    defaultValue?:any;
    comment?:string;
    bind?:string;
    tags?:Record<string,string>;
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
