import { AtDotStyle, AtDotStyleCtrl, AtDotStyleDefaults, BaseLayoutProps, ClassNameValue, ParseAtDotStyle, bcn, cn } from "@iyio/common";
import { atDotCssRenderer } from "./at-dot-css.deps";

const ctrlKey=Symbol('ctrlKey');

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

    const root=(
        flags?:Record<string,any>,
        opts?:{classNameValues?:ClassNameValue[],baseLayout?:BaseLayoutProps}
    ):string=>{
        if(!inserted && !disableAutoInsert){
            insertStyleSheet();
        }
        let c=name;
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

    let inserted=false;
    const insertStyleSheet=()=>{
        if(inserted){
            return;
        }
        inserted=true;

        const renderer=atDotCssRenderer();

        renderer.removeSheet(id);
        renderer.addSheet(id,options);

    }

    const removeStyleSheet=()=>{
        if(!inserted){
            return;
        }
        inserted=false;
        atDotCssRenderer().removeSheet(id);
    }

    const isStyleSheetInserted=()=>inserted;
    root.toString=root;

    const ctrl:AtDotStyleCtrl={
        insertStyleSheet:insertStyleSheet,
        removeStyleSheet:removeStyleSheet,
        isStyleSheetInserted:isStyleSheetInserted,
    };
    const style:any={
        [ctrlKey]:ctrl,
        root,
        toString:root,
    };

    const replacer=(_:string|undefined,n:string|undefined)=>{

        const className=(n && n!=='root')?`.${name} .${prefix}${n}`:'.'+name;
        if(!n || style[n]){
            return className;
        }

        const prop=(
            flags?:Record<string,any>,
            opts?:{classNameValues?:ClassNameValue[],baseLayout?:BaseLayoutProps}
        )=>{
            if(!inserted && !disableAutoInsert){
                insertStyleSheet();
            }
            let c=n?prefix+n:name;
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
        prop.toString=prop;
        style[n]=prop;

        return className;
    }

    if(!options.disableParsing){
        options.css=(
            options.css
            .replace(/@\.([\w-]+)/g,replacer)
            .replace(
                /\W(backdrop-filter)\s*:([^;}:]*)/gim,
                (match,prop,value)=>`${match};-webkit-${prop}:${value}`)
        ) as any;
    }

    return style;
};

export const getAtDotCtrl=(style:ParseAtDotStyle<string>):AtDotStyleCtrl=>{
    return (style as any)[ctrlKey];
}
