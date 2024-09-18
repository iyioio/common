import { AcTaggedPropRenderer } from "../any-comp-types";
import { AcPrAnimation } from "./AcPrAnimation";
import { AcPrBreakpoint } from "./AcPrBreakpoint";
import { AcPrClassName } from "./AcPrClassName";
import { AcPrColorMap } from "./AcPrColorMap";
import { AcPrColors } from "./AcPrColors";
import { AcPrColumn } from "./AcPrColumn";
import { AcPrFlex } from "./AcPrFlex";
import { AcPrFlexLayout } from "./AcPrFlexLayout";
import { AcPrGap } from "./AcPrGap";
import { AcPrGrid } from "./AcPrGrid";
import { AcPrLayout } from "./AcPrLayout";
import { AcPrPaddingMargin } from "./AcPrPaddingMargin";
import { AcPrSelfAlignment } from "./AcPrSelfAlignment";
import { AcPrText } from "./AcPrText";
import { AcPrUtil } from "./AcPrUtil";

export const defaultAcPropRendererMap:Record<string,AcTaggedPropRenderer>={
    className:{
        tag:'acGroup',
        tagValue:'className',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrClassName ctrl={ctrl} props={props}/>
        }
    },
    animation:{
        tag:'acGroup',
        tagValue:'animation',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrAnimation ctrl={ctrl} props={props}/>
        }
    },
    column:{
        tag:'acGroup',
        tagValue:'column',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrColumn ctrl={ctrl} props={props}/>
        }
    },
    text:{
        tag:'acGroup',
        tagValue:'text',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrText ctrl={ctrl} props={props}/>
        }
    },
    colors:{
        tag:'acGroup',
        tagValue:'colors',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrColors ctrl={ctrl} props={props}/>
        }
    },
    colorMap:{
        tag:'acGroup',
        tagValue:'colorMap',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrColorMap ctrl={ctrl} props={props}/>
        }
    },
    gap:{
        tag:'acGroup',
        tagValue:'gap',
        order:-4,
        render:(ctrl,tag,props)=>{
            return <AcPrGap ctrl={ctrl} props={props}/>
        }
    },
    padding:{
        tag:'acGroup',
        tagValue:['padding','margin'],
        order:-3,
        render:(ctrl,tag,props,groups)=>{
            return <AcPrPaddingMargin ctrl={ctrl} props={props} groups={groups}/>
        }
    },
    flexLayout:{
        tag:'acGroup',
        tagValue:'flexLayout',
        order:-2,
        render:(ctrl,tag,props)=>{
            return <AcPrFlexLayout ctrl={ctrl} props={props}/>
        }
    },
    selfAlignment:{
        tag:'acGroup',
        tagValue:'selfAlignment',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrSelfAlignment ctrl={ctrl} props={props}/>
        }
    },
    flex:{
        tag:'acGroup',
        tagValue:'flex',
        order:-3,
        render:(ctrl,tag,props)=>{
            return <AcPrFlex ctrl={ctrl} props={props}/>
        }
    },
    grid:{
        tag:'acGroup',
        tagValue:'grid',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrGrid ctrl={ctrl} props={props}/>
        }
    },
    breakpoint:{
        tag:'acGroup',
        tagValue:'breakpoint',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrBreakpoint ctrl={ctrl} props={props}/>
        }
    },
    layout:{
        tag:'acGroup',
        tagValue:'layout',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrLayout ctrl={ctrl} props={props}/>
        }
    },
    util:{
        tag:'acGroup',
        tagValue:'util',
        order:-1,
        render:(ctrl,tag,props)=>{
            return <AcPrUtil ctrl={ctrl} props={props}/>
        }
    },
}

export const defaultAcPropRenderers:AcTaggedPropRenderer[]=[]

for(const e in defaultAcPropRendererMap){
    const r=defaultAcPropRendererMap[e];
    if(r){
        defaultAcPropRenderers.push(r);
    }
}
