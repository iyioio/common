
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

export const acContainerKey=Symbol('acContainerKey');
export const acIndexKey=Symbol('acIndexKey');

export type AcType="string"|"number"|"bigint"|"boolean"|"symbol"|"undefined"|"null"|"object"|"function"|"union";
export interface AcProp{
    name:string;
    optional:boolean;
    type:AcTypeDef;

    sig:string;
    defaultValueText?:string;
    defaultValue?:any;
    comment?:string;
    bind?:string;
    tags?:Record<string,string>;

    [acIndexKey]?:number;
    [acContainerKey]?:AcPropContainer;
}

export interface AcPropContainer
{
    key:string;
    index:number;
    props:AcProp[];
}

export interface AcTypeContainer
{
    key:string;
    index:number;
    type:AcTypeDef;
}


export interface AcTypeDef
{
    type:AcType;
    isLiteral?:boolean;
    literalValue?:any;
    unionValues?:AcUnionValue[];

    [acIndexKey]?:number;
    [acContainerKey]?:AcTypeContainer;
}

export interface AcUnionValue
{
    type:AcType;
    label:string;
    isLiteral?:boolean;
    literalValue?:any;
}

export interface AcCompRegistry
{
    comps:AcComp[];
}
