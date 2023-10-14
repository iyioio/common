import { AcComp, AcCompRegistry } from "./any-comp-types";


export interface AnyCompProps
{
    comp?:AcComp;
    compProps?:Record<string,any>;
    compId?:string;
    compPath?:string;
    compName?:string;
    reg?:AcCompRegistry;
    placeholder?:any;
}

export function AnyComp({
    compId,
    compPath,
    compName,
    reg,
    comp=(
        !reg?
            undefined
        :compId?
            reg.comps.find(c=>c.id===compId)
        :compPath?
            reg.comps.find(c=>c.path===compPath)
        :compName?
            reg.comps.find(c=>c.name===compName)
        :
            undefined
    ),
    compProps={},
    placeholder
}:AnyCompProps){
    return (
        (typeof comp?.comp === 'function')?comp.comp(compProps,placeholder):null
    )
}
