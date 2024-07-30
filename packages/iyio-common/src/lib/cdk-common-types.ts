export interface PassiveAccessGrantDescription
{
    grantName:string;
    /**
     * If true all fns should be granted access
     */
    allFns?:boolean;

    /**
     * If true all passive targets should be grated access
     */
    all?:boolean;

    targetName?:string;
    types?:CommonAccessType[];
}

export const allCommonAccessTypes=['read','write','delete','invoke','list','scan','query','auth'] as const;
export type CommonAccessType=typeof allCommonAccessTypes[number];

export interface IamPolicyDescription
{
    allow:boolean;
    actions:string[];
    resources:string[];
}
export interface AccessRequestDescription
{
    grantName:string;
    types?:CommonAccessType[];
    iamPolicy?:IamPolicyDescription;
}

export interface IEventDestination
{
    type:string;
    targetName:string;
    props?:Record<string,string>;
}
