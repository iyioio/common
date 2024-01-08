import { AllBaseLayoutProps, AtDotStyle, AtDotStyleCtrl, AtDotStyleDefaults, ClassNameValue, ParseAtDotStyle, bcn, cn, getSizeQueryForBreakpoint, styleSheetRenderer } from "@iyio/common";

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
    classNameValues?:ClassNameValue|null,
    baseLayout?:AllBaseLayoutProps|null
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
    if(baseLayout){
        c=bcn(baseLayout,c,classNameValues)??'';
    }else if(classNameValues){
        c=cn(c,classNameValues);
    }
    return c;
}

function rootDef(
    this:PropRef,
    flags?:Record<string,any>,
    classNameValues?:ClassNameValue|null,
    baseLayout?:AllBaseLayoutProps|null
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
    if(baseLayout){
        c=bcn(baseLayout,c,classNameValues)??'';
    }else if(classNameValues){
        c=cn(c,classNameValues);
    }
    return c;
}

function varsDef(
    this:PropRef,
    vars?:any,
    styleOrElem?:Partial<CSSStyleDeclaration>|HTMLElement
):Record<string,any>|undefined{
    if(!vars && !styleOrElem){
        return undefined;
    }
    if(styleOrElem && globalThis.HTMLElement && (styleOrElem instanceof globalThis.HTMLElement)){
        if(!vars){
            return undefined;
        }
        for(const e in vars){
            const v=vars[e];
            if(v===undefined || (typeof v === 'object')){
                styleOrElem.style.removeProperty(`--${this.name}-${e}`);
            }else{
                styleOrElem.style.setProperty(`--${this.name}-${e}`,v);
            }
        }
        return undefined;
    }else{
        if(!vars){
            return styleOrElem;
        }
        const obj:any=styleOrElem?{...styleOrElem}:{};
        for(const e in vars){
            const v=vars[e];
            if(v===undefined || (typeof v === 'object')){
                continue;
            }
            obj[`--${this.name}-${e}`]=vars[e];
        }
        return obj;
    }
}

/**
 * Creates a new at-dot-css flavored CSS style sheet. The returned style object will contain
 * function properties corresponding to each of the at-dot selectors defined in the style sheet.
 *
 * The returned style sheet will included intellisense for all at-dot-css selectors. at-dot-css
 * selectors use the following format:
 * @.SELECTOR_NAME
 *
 * The content of the style sheet is used as a Typescript type to generate intellisense. Due to a
 * restriction in the Typescript typing engine only about 45 at-dot-css selectors can be defined
 * before needing to add a section separator which looks like "/*- selection -*\/". The sections
 * allow the style sheet to be parsed in sections.
 *
 * At least one of the function properties must be called before the style sheet is inserted into
 * the DOM or virtual style sheet collection. When using at-dot-css in the browser style sheets
 * are inserted into the head of the current document.
 */
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

        const renderer=styleSheetRenderer();

        renderer.removeSheet(id);
        renderer.addSheet(options as any);

    }

    const removeStyleSheet=()=>{
        if(!ctrl.isInserted){
            return;
        }
        ctrl.isInserted=false;
        styleSheetRenderer().removeSheet(id);
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

        const className=(n && n!=='root')?`.${prefix}${n}`:'.'+name;
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
