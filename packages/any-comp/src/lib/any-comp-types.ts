
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

    /**
     * Optional
     */
    o?:boolean;
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

export interface AcTagContainer
{
    key:string;
    index:number;
    tags:Record<string,string>;
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
export type AcTaggedPropRendererCallback=(comp:AcComp,tag:string,props:AcProp[])=>any;

export interface AcTaggedPropRenderer
{
    /**
     * Name of the tag to match the renderer to
     */
    tag:string;

    /**
     * If defined the tag value must also match for the renderer to be matched
     */
    tagValue?:string;

    /**
     * Renders matched props
     */
    render:AcTaggedPropRendererCallback;

    /**
     * Controls the order that the renderers or rendered in. Negative values will be rendered before
     * default inputs.
     */
    order?:number;
}

export interface AnyCompSaveState
{
    props?:Record<string,any>;
    extra?:string
    bindings?:Record<string,string>;
}

export interface AnyCompBoolLabels
{
    trueLabel:string;
    falseLabel:string;
}
