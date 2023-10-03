import { AtDotCssOptions, AtDotCssOptionsDefaults, BaseLayoutProps, ClassNameValue, ParseAtDotSheet, bcn, cn } from "@iyio/common";
import { atDotCssRenderer } from "./at-dot-css.deps";

export const atDotCss=<S extends string>(
    options:AtDotCssOptions<S>,
    defaults?:AtDotCssOptionsDefaults
):ParseAtDotSheet<S>=>{

    const namespace=options.namespace??defaults?.namespace;
    const name=options.id??namespace?`${namespace}--${options.name}`:options.name;
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

    root.insertStyleSheet=insertStyleSheet;
    root.removeStyleSheet=removeStyleSheet;
    root.isStyleSheetInserted=isStyleSheetInserted;
    root.toString=root;

    const replacer=(_:string|undefined,n:string|undefined)=>{
        if(n==='root'){
            n='';
        }
        if(n!==undefined && !(root as any)[n]){
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
            prop.insertStyleSheet=insertStyleSheet;
            prop.isStyleSheetInserted=isStyleSheetInserted;
            prop.toString=prop;
            (root as any)[n]=prop;
        }

        return n?`.${name} .${prefix}${n}`:'.'+name;
    }
    if(!options.disableParsing){
        options.css=(
            options.css
            .replace(/@\.([\w-]+)/g,replacer)
            .replace(
                /\W(backdrop-filter)\s*:([^;}:]*)/gim,
                (match,prop,value)=>`${match};-webkit-${prop}:${value}`)
        )as any;
    }

    (root as any).root=root;

    return root as any;
};
