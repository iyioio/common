import { ComObJsxRenderer, CompObj, CompObjRenderOptions, compObjTypeKey, isCompObj } from "./comp-obj-types";

export const renderCompObj=(comp:CompObj,jsxs:ComObJsxRenderer,jsx:ComObJsxRenderer,options:CompObjRenderOptions={}):any=>{

    const props:Record<string,any>={};

    const type=comp[compObjTypeKey];

    const compP=compObjLookup(type,options);
    if(compP===undefined){
        throw new Error(`No component registered by type - ${comp[compObjTypeKey]}`);
    }

    const cp=comp.props;
    if(cp){
        for(const e in cp){
            const v=cp[e];
            if(e==='children' && Array.isArray(v)){
                const ary:any[]=[];
                for(const child of v){
                    if(isCompObj(child)){
                        ary.push(renderCompObj(child,jsx,jsx,options));
                    }else{
                        ary.push(child);
                    }
                }
                props[e]=ary;
            }else{
                if(isCompObj(v)){
                    props[e]=renderCompObj(v,jsx,jsx,options);
                }else{
                    props[e]=v;
                }
            }
        }
    }

    return jsxs(compP,props);

}

export const compObjLookup=(type:string,options:CompObjRenderOptions):any=>{
    if(!type){
        return undefined;
    }
    const f=type[0] as string;
    if(!options.includeLower && f.toLowerCase()===f){
        return type;
    }

    const comp=options.compLookup?.(type);
    if(comp!==undefined){
        return comp;
    }

    return options.compReg?.[type];
}
