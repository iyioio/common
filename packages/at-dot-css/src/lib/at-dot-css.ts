import { AtDotStyle, AtDotStyleCtrl, AtDotStyleDefaults, BaseLayoutProps, ClassNameValue, ParseAtDotStyle, bcn, cn, getSizeQueryForBreakpoint } from "@iyio/common";
import { atDotCssRenderer } from "./at-dot-css.deps";

const ctrlKey=Symbol('ctrlKey');

const selectorReg=/@\.([\w-]+)/g;
const varReg=/(@@@?)([\w-]+)/g;
const breakPointReg=/@(mobileSmUp|mobileUp|tabletSmUp|tabletUp|desktopSmUp|desktopUp|mobileSmDown|mobileDown|tabletSmDown|tabletDown|desktopSmDown|desktopDown)/g;
const prefixReg=/\W(backdrop-filter)\s*:([^;}:]*)/gim;

interface PropRef
{
    name:string;
    ctrl:AtDotStyleCtrl;
    disableAutoInsert:boolean;
    prefix:string;
}

function propDef(
    this:PropRef,
    flags?:Record<string,any>,
    opts?:{classNameValues?:ClassNameValue[],baseLayout?:BaseLayoutProps}
):string{
    if(!this.ctrl.isInserted && !this.disableAutoInsert){
        this.ctrl.insertStyleSheet();
    }
    let c=this.name?this.prefix+this.name:(this.name??'');
    if(flags){
        for(const e in flags){
            if(flags[e]){
                c+=' '+e;
            }
        }
    }
    if(opts){
        if(opts.baseLayout){
            c=bcn(opts.baseLayout,c,opts.classNameValues)??'';
        }else if(opts.classNameValues){
            c=cn(c,opts.classNameValues);
        }
    }
    return c;
}

function rootDef(
    this:PropRef,
    flags?:Record<string,any>,
    opts?:{classNameValues?:ClassNameValue[],baseLayout?:BaseLayoutProps}
):string{
    if(!this.ctrl.isInserted && !this.disableAutoInsert){
        this.ctrl.insertStyleSheet();
    }
    let c=this.name;
    if(flags){
        for(const e in flags){
            if(flags[e]){
                c+=' '+e;
            }
        }
    }
    if(opts){
        if(opts.baseLayout){
            c=bcn(opts.baseLayout,c,opts.classNameValues)??'';
        }else if(opts.classNameValues){
            c=cn(c,opts.classNameValues);
        }
    }
    return c;
}

function varsDef(
    this:PropRef,
    vars?:any,
    style?:Partial<CSSStyleDeclaration>
):Record<string,any>|undefined{
    if(!vars && !style){
        return undefined;
    }
    if(!vars){
        return style;
    }
    const obj:any=style?{...style}:{};
    for(const e in vars){
        obj[`--${this.name}-${e}`]=vars[e];
    }
    return obj;
}

export const atDotCss=<S extends string>(
    options:AtDotStyle<S>,
    defaults?:AtDotStyleDefaults
):ParseAtDotStyle<S>=>{

    const namespace=options.namespace??defaults?.namespace;
    const name=`${namespace?`${namespace}--`:''}${options.name}${options.id?`--${options.id}`:''}`;
    const disableAutoInsert=(options.disableAutoInsert || defaults?.disableAutoInsert)?true:false
    const prefix=name+'-';
    if(!options.id){
        options.id='at-dot-css-'+name;
    }
    const id=options.id;

    let processed=false;
    const insertStyleSheet=()=>{
        if(ctrl.isInserted){
            return;
        }
        ctrl.isInserted=true;

        if(!processed){
            processed=true;
            options.css=(
                options.css
                .replace(varReg,(_,ats:string,varName:string)=>ats.length===3?
                    `${name}-${varName}`:
                    `var(--${name}-${varName})`)
                .replace(breakPointReg,(_,bp)=>`@media(${getSizeQueryForBreakpoint(bp)})`)
                .replace(prefixReg,(match,prop,value)=>`${match};-webkit-${prop}:${value}`)
            ) as any;
        }

        if(options.debug){
            console.info('atDotCss insert',options,options.css);
        }

        const renderer=atDotCssRenderer();

        renderer.removeSheet(id);
        renderer.addSheet(id,options);

    }

    const removeStyleSheet=()=>{
        if(!ctrl.isInserted){
            return;
        }
        ctrl.isInserted=false;
        atDotCssRenderer().removeSheet(id);
    }

    const ctrl:AtDotStyleCtrl={
        insertStyleSheet:insertStyleSheet,
        removeStyleSheet:removeStyleSheet,
        isInserted:false,
    };

    const rootRef:PropRef={
        name,
        ctrl,
        disableAutoInsert,
        prefix
    };

    const root=rootDef.bind(rootRef);

    root.toString=root;
    const style:any={
        [ctrlKey]:ctrl,
        root,
        toString:root,
        vars:varsDef.bind(rootRef)
    };



    const replacer=(_:string|undefined,n:string|undefined)=>{

        const className=(n && n!=='root')?`.${name} .${prefix}${n}`:'.'+name;
        if(!n || style[n]){
            return className;
        }
        const ref:PropRef={
            name:n,
            ctrl,
            disableAutoInsert,
            prefix
        }
        const prop=propDef.bind(ref);
        prop.toString=prop;
        style[n]=prop;

        return className;
    }

    if(!options.disableParsing){
        options.css=(
            options.css
            .replace(selectorReg,replacer)
        ) as any;
    }

    return style;
};

export const getAtDotCtrl=(style:ParseAtDotStyle<string>):AtDotStyleCtrl=>{
    return (style as any)[ctrlKey];
}
