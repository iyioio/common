import { AcTaggedPropRenderer } from "./any-comp-types";

export const defaultAcPropRendererMap:Record<string,AcTaggedPropRenderer>={
    gap:{
        tag:'acGroup',
        tagValue:'gap',
        order:-1,
        render:(comp,tag,props)=>{
            return <h1>Gap</h1>
        }
    },
    margin:{
        tag:'acGroup',
        tagValue:'margin',
        order:-1,
        render:(comp,tag,props)=>{
            return <h1>Margin</h1>
        }
    }
}

export const defaultAcPropRenderers:AcTaggedPropRenderer[]=[]

for(const e in defaultAcPropRendererMap){
    const r=defaultAcPropRendererMap[e];
    if(r){
        defaultAcPropRenderers.push(r);
    }
}
