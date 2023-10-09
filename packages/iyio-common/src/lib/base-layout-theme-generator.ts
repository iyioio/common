import { getBaseLayoutDefaults } from "./base-layout-defaults";
import { BaseLayoutCssOptions, BaseLayoutVarContainer, FontFace } from "./base-layout-generator-types";
import { deepClone } from "./object";

export const createBaseLayoutTheme=(props:BaseLayoutCssOptions):BaseLayoutCssOptions=>{

    const defaults=getBaseLayoutDefaults(deepClone(props));

    const {options,varMap}=toVars(defaults);

    const vars:BaseLayoutVarContainer[]=[];
    options.vars=vars;
    vars.push({
        selector:`:root,.theme-default${props.defaultTheme?`,.theme-${props.defaultTheme}`:''}`,
        vars:varMap,
    });

    if(props.themes){
        for(const theme in props.themes){
            const t=props.themes[theme];
            if(!t){
                continue;
            }
            const {varMap}=toVars(t);
            vars.push({
                selector:`.theme-${theme}`,
                vars:varMap,
            });
        }
    }

    return options;

}

const toVars=(options:BaseLayoutCssOptions):{options:BaseLayoutCssOptions,varMap:Record<string,string>}=>{

    const varMap:Record<string,string>={};

    return {
        varMap,
        options:{
            ...options,
            spacing:mapToVars(varMap,options.spacing,'s',{space:''}),
            columnWidths:mapToVars(varMap,options.columnWidths,'col-'),
            animationSpeeds:mapToVars(varMap,options.animationSpeeds,'an-'),
            colors:mapToVars(varMap,options.colors,'c',{fontColor:'f',color:''},/^(color|fontColor)\W/),
            fontConfig:mapToVars(varMap,options.fontConfig,'f-',{face:'',...faceMap},/^(css|h(\d+)|body)$/,{face:'',Default:'d'}),
            semiTransparency:'var(--iy-trans)',
            containerMargin:'var(--iy-con-m)',
        }
    }

}

const faceMap:Required<FontFace>={
    size:'s',
    lineHeight:'h',
    family:'f',
    color:'c',
    weight:'w',
    style:'st',
    stretch:'sr',
    kerning:'k',
    transform:'t',
    variation:'v',
    spacing:'sp',
    css:'',
}

export const mapToVars=<T>(
    vars:Record<string,string>,
    obj:T,
    prefix:string,
    keyMap:Record<string,string>={},
    excludeKeys?:RegExp,
    subKeyMap?:Record<string,string>):T=>{

    if(!obj){
        return obj;
    }

    const mapped:any={};

    for(const e in obj){

        const value=obj[e];

        if(value===undefined && excludeKeys?.test(e)){
            continue;
        }


        if(typeof value === 'string'){
            let key=e as string;
            for(const m in keyMap){
                if(key.includes(m)){
                    key=key.replace(m,keyMap[m]??'');
                }
            }
            key='iy-'+prefix+key;
            if(vars[key]!==undefined){
                throw new Error(`css layout var conflict. key = ${key}, prop = ${e}`)
            }
            vars[key]=value;
            mapped[e]=`var(--${key})`;
        }else if(value && (typeof value === 'object')){
            let sub=e as string;
            if(subKeyMap){
                for(const s in subKeyMap){
                    if(sub.includes(s)){
                        sub=sub.replace(s,subKeyMap[s]??'');
                    }
                }
            }
            mapped[e]=mapToVars(vars,obj[e],prefix+sub+'-',keyMap,excludeKeys);
        }else{
            mapped[e]=value;
        }

    }

    return mapped;
}
