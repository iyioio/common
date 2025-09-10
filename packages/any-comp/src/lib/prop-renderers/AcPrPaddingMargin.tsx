import { atDotCss } from "@iyio/at-dot-css";
import { NamedValue, baseLayoutMarginProps, baseLayoutPaddingProps } from "@iyio/common";
import { SelectWrapper, SlimButton, Text } from "@iyio/react-common";
import { useState } from "react";
import { AnyCompIcon } from "../AnyCompIcon.js";
import { AnyCompViewCtrl } from "../AnyCompViewCtrl.js";
import { useUpdateOnAnyCompPropChange } from "../any-comp-react-lib.js";
import { acStyle } from "../any-comp-style.js";
import { AcProp } from "../any-comp-types.js";
import { getBaseLayoutInfo } from "./prop-render-lib.js";

type Keys=(keyof typeof baseLayoutPaddingProps)|(keyof typeof baseLayoutMarginProps);
type Mode='uniform'|'axis'|'side';
interface Sides
{
    l?:string;
    r?:string;
    t?:string;
    b?:string;
}

const sizes=Object.keys(baseLayoutMarginProps);
for(let i=0;i<sizes.length;i++){
    const k=sizes[i];
    if(!k || !isFinite(Number(k[1]))){
        sizes.splice(i,1);
        i--;
    }else{
        sizes[i]=k.substring(1);
    }
}

const getSideSizes=(type:'p'|'m',cProps:Record<string,any>):Sides=>{

    let l:string|undefined;
    let r:string|undefined;
    let t:string|undefined;
    let b:string|undefined;


    for(const size of sizes){
        const prop=`${type}${size}`;
        if(cProps[prop]){
            l=r=t=b=size;
        }
    }

    for(const a of axis){
        for(const size of sizes){
            const prop=`${type}${a}${size}`;
            if(cProps[prop]){
                if(a==='h'){
                    l=r=size;
                }else{
                    t=b=size;
                }
            }
        }
    }

    for(const s of sides){
        for(const size of sizes){
            const prop=`${type}${s}${size}`;
            if(cProps[prop]){
                if(s==='l'){
                    l=size;
                }else if(s==='r'){
                    r=size;
                }else if(s==='t'){
                    t=size;
                }else{
                    b=size;
                }
            }
        }
    }
    return {l,r,t,b};
}

const sides=['l','r','t','b'] as const;
const axis=['h','v'] as const;
const getMode=(type:'p'|'m',cProps:Record<string,any>):Mode=>{

    const s=getSideSizes(type,cProps);

    return (
        (s.l===s.r && s.l===s.t && s.l===s.b)?
            'uniform'
        :(s.l===s.r && s.t===s.b)?
            'axis'
        :
            'side'
        )
}

const clearAll=(ctrl:AnyCompViewCtrl,type:'p'|'m')=>{
     const cProps=ctrl.computedProps;
    const obj=type==='p'?baseLayoutPaddingProps:baseLayoutMarginProps;

    for(const e in obj){
        if(cProps[e] && isFinite(Number(e[1]))){
            ctrl.setProp(e,undefined);
        }
        if(cProps[e] && (e.includes('h') || e.includes('v'))){
            ctrl.setProp(e,undefined);
        }
        if(cProps[e] && (e.includes('l') || e.includes('r') || e.includes('t') || e.includes('b'))){
            ctrl.setProp(e,undefined);
        }
    }
}


const convertMode=(ctrl:AnyCompViewCtrl,type:'p'|'m',mode:Mode,joinAxis?:boolean)=>{

    const cProps=ctrl.computedProps;

    const s=getSideSizes(type,cProps);

    if(mode==='uniform'){
        const size=s.t??s.l??s.r??s.b;
        clearAll(ctrl,type);
        if(size){
            ctrl.setProp(`${type}${size}`,true);
        }
    }else if(mode==='axis'){
        const hSize=s.l??s.r;
        const vSize=s.t??s.b;
        clearAll(ctrl,type);
        if(hSize && hSize===vSize){
            ctrl.setProp(`${type}${hSize}`,true);
        }else{
            if(hSize){
                ctrl.setProp(`${type}h${hSize}`,true);
            }
            if(vSize){
                ctrl.setProp(`${type}v${vSize}`,true);
            }
        }
    }else{
        clearAll(ctrl,type);
        if(s.l && s.l===s.r){
            ctrl.setProp(`${type}h${s.l}`,true);
        }else{
            if(s.l){
                ctrl.setProp(`${type}l${s.l}`,true);
            }
            if(s.r){
                ctrl.setProp(`${type}r${s.r}`,true);
            }
        }
        if(s.t && s.t===s.b){
            ctrl.setProp(`${type}v${s.t}`,true);
        }else{
            if(s.t){
                ctrl.setProp(`${type}t${s.t}`,true);
            }
            if(s.b){
                ctrl.setProp(`${type}b${s.b}`,true);
            }
        }
    }
}
const normalizeMode=(ctrl:AnyCompViewCtrl,type:'p'|'m'):Mode=>{

    const cProps=ctrl.computedProps;
    const mode=getMode(type,cProps);
    convertMode(ctrl,type,mode,true);
    return mode;
}

const optionsCache:Record<string,NamedValue<any>[]>={};
const getOptions=(props:Record<string,any>,type:'p'|'m',a:'h'|'v',s:'l'|'r'|'t'|'b'):NamedValue<any>[]=>{
    const key=`${type}${a}${s}`;
    const existing=optionsCache[key];
    if(existing){
        return existing;
    }
    const items:NamedValue<any>[]=[];

    for(const k of sizes){
        items.push({
            name:k==='0'?'0':k[0]==='0'?'.'+k.substring(1):k.length>2?k[0]+'.'+k.substring(1):k,
            value:k
        })
    }

    optionsCache[key]=items;
    return items;
}

export interface AcPrPaddingMarginProps
{
    ctrl:AnyCompViewCtrl;
    props:AcProp[];
    groups:Record<string,AcProp[]>;
}

export function AcPrPaddingMargin({
    ctrl,
    props,
    groups
}:AcPrPaddingMarginProps){

    const {
        cProps,
    }=getBaseLayoutInfo(ctrl,props);

    const hasPadding=groups['padding']?.length?true:false;
    const hasMargin=groups['margin']?.length?true:false;

    useUpdateOnAnyCompPropChange(ctrl,hasPadding?baseLayoutPaddingProps:null);
    useUpdateOnAnyCompPropChange(ctrl,hasMargin?baseLayoutMarginProps:null);

    const [paddingMode,setPaddingMode]=useState<Mode>(()=>getMode('p',cProps));
    const [marginMode,setMarginMode]=useState<Mode>(()=>getMode('m',cProps));

    const center=<div className={style.center()}/>

    let content=center;

    const createSelect=(className:string,type:'p'|'m',a:'h'|'v',s:'l'|'r'|'t'|'b'):any=>{

        const props=ctrl.computedProps;
        const obj=type==='p'?baseLayoutPaddingProps:baseLayoutMarginProps;
        const options=getOptions(props,type,a,s) as any as NamedValue<Keys>[];
        let value:Keys|undefined;
        for(const e in obj){
            if(cProps[e] && e[0]===type && isFinite(Number(e[1]))){
                value=e.substring(1) as any;
            }
        }
        for(const e in obj){
            if(cProps[e] && e.includes(a)){
                value=e.substring(2) as any;
            }
        }
        for(const e in obj){
            if(cProps[e] && e.includes(s)){
                value=e.substring(2) as any;
            }
        }

        const mode=type==='p'?paddingMode:marginMode;
        const locked=(
            mode==='uniform'?
                s!=='t'
            :mode==='axis'?
                a==='h'?s==='r':s==='b'
            :
                false
        )

        return (
            <SelectWrapper
                placeholder="-"
                className={style.select({locked},className)}
                options={options}
                value={value}
                defaultOption={{
                    name:'Inherit',
                    value:undefined
                }}
                onChange={v=>{
                    if(locked){
                        for(const e in obj){
                            if(cProps[e] && e.includes(s)){
                                ctrl.setProp(e,undefined);
                            }
                        }
                        if(v){
                            ctrl.setProp(`${type}${s}${v}`,true);
                        }
                        const mode=normalizeMode(ctrl,type);
                        if(type==='m'){
                            setMarginMode(mode);
                        }else{
                            setPaddingMode(mode);
                        }
                    }else{
                        if(mode==='uniform'){
                            clearAll(ctrl,type)
                            for(const e in obj){
                                if(cProps[e] && isFinite(Number(e[1]))){
                                    ctrl.setProp(e,undefined);
                                }
                                if(cProps[e] && (e.includes('h') || e.includes('v'))){
                                    ctrl.setProp(e,undefined);
                                }
                                if(cProps[e] && (e.includes('l') || e.includes('r') || e.includes('t') || e.includes('b'))){
                                    ctrl.setProp(e,undefined);
                                }
                            }
                            if(v){
                                ctrl.setProp(`${type}${v}`,true);
                                normalizeMode(ctrl,type);
                            }
                        }else if(mode==='axis'){
                            for(const e in obj){
                                if(cProps[e] && e.includes(a)){
                                    ctrl.setProp(e,undefined);
                                }
                                if(cProps[e] && (a==='h'?(e.includes('l') || e.includes('r')):(e.includes('t') || e.includes('b')))){
                                    ctrl.setProp(e,undefined);
                                }
                            }
                            if(v){
                                ctrl.setProp(`${type}${a}${v}`,true);
                                normalizeMode(ctrl,type);
                            }
                        }else{
                            for(const e in obj){
                                if(cProps[e] && e.includes(s)){
                                    ctrl.setProp(e,undefined);
                                }
                            }
                            if(v){
                                ctrl.setProp(`${type}${s}${v}`,true);
                                normalizeMode(ctrl,type);
                            }
                        }
                    }
                }}
            >
                {locked && <AnyCompIcon className={style.link({horizontal:a==='h'})} icon="link"/>}
            </SelectWrapper>
        )
    }

    if(hasPadding){
        content=(
            <div className={style.padding()}>
                {content}
                <Text absTopLeft p025 xxs opacity050 text="padding" />
                <SlimButton absTopRight p025 onClick={()=>{
                    const mode=paddingMode==='uniform'?'axis':paddingMode==='axis'?'side':'uniform';
                    setPaddingMode(mode);
                    convertMode(ctrl,'p',mode);
                }}>
                    <AnyCompIcon icon={`mode-${paddingMode}`}/>
                </SlimButton>
                {createSelect(style.left(),'p','h','l')}
                {createSelect(style.right(),'p','h','r')}
                {createSelect(style.top(),'p','v','t')}
                {createSelect(style.bottom(),'p','v','b')}
            </div>
        )
    }

    if(hasMargin){

        content=(
            <div className={style.margin()}>
                {content}
                <Text absTopLeft p025 xxs opacity050 text="margin" />
                <SlimButton absTopRight p025 onClick={()=>{
                    const mode=marginMode==='uniform'?'axis':marginMode==='axis'?'side':'uniform';
                    setMarginMode(mode);
                    convertMode(ctrl,'m',mode);
                }}>
                    <AnyCompIcon icon={`mode-${marginMode}`}/>
                </SlimButton>
                {createSelect(style.left(),'m','h','l')}
                {createSelect(style.right(),'m','h','r')}
                {createSelect(style.top(),'m','v','t')}
                {createSelect(style.bottom(),'m','v','b')}
            </div>
        )
    }

    return (
        <div className={style.root()} style={style.vars({vSize:'1.6rem',hSize:'2.4rem'})}>

            <Text mb050 opacity050 text={(hasMargin && hasPadding)?'margin / padding':hasPadding?'padding':'margin'} />

            {content}

        </div>
    )

}

const style=atDotCss({namespace:'AnyComp',name:'AcPrPaddingMargin',css:`
    @.root{
        display:flex;
        flex-direction:column;
        margin-bottom:1rem;
    }
    @.center{
        background-color:${acStyle.var('borderColor')};
        height:@@vSize;
        min-width:2rem;
    }
    @.padding, @.margin{
        position:relative;
        border:${acStyle.var('borderDefault')};
        padding:@@vSize @@hSize;
    }
    @.select{
        position:absolute;
        border:none;
        background:none;
        font-size:10px;
        padding:0;
        min-width:1rem;
        min-height:1rem;
        justify-content:center;
        align-items:center;
        transition:transform 0.2s ease-in-out;
    }
    @.select.locked{
        opacity:0.5;
    }
    @.top{
        left:50%;
        top:0%;
        transform:translate(-50%, calc( ( @@vSize - 100% ) / 2 ) );
    }
    @.bottom{
        left:50%;
        bottom:0%;
        transform:translate(-50%, calc( ( @@vSize - 100% ) / -2 ) );
    }
    @.left{
        left:0%;
        top:50%;
        transform:translate(calc( ( @@hSize - 100% ) / 2 ) , -50% );
    }
    @.right{
        right:0%;
        top:50%;
        transform:translate(calc( ( @@hSize - 100% ) / -2 ) , -50% );
    }
    @.link{
        position:absolute;
        right:0rem;
        top:50%;
        transform:translate(100%,-50%);
        opacity:0.5;
    }
    @.link.horizontal{
        right:unset;
        top:unset;
        left:50%;
        bottom:0rem;
        transform:translate(-50%,100%);
    }
`});
