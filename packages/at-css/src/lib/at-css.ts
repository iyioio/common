import { AtCssOptions, AtCssOptionsDefaults, BaseLayoutProps, ClassNameValue, ParseAtSheet, bcn, cn } from "@iyio/common";

export const atCss=<S extends string>(
    options:AtCssOptions<S>,
    defaults?:AtCssOptionsDefaults
):ParseAtSheet<S>=>{

    const namespace=options.namespace??defaults?.namespace;
    const name=namespace?`${namespace}--${options.name}`:options.name;
    const disableAutoInsert=(options.disableAutoInsert || defaults?.disableAutoInsert)?true:false
    const prefix=name+'-';

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

        if(!globalThis?.document?.createElement){
            return;
        }

        const style=globalThis.document.createElement('style');
        //todo - add prefixes
        style.innerHTML=options.css;
        (options as any).css='';

        //todo - enforce order
        globalThis.document.head.append(style);

    }

    const isStyleSheetInserted=()=>inserted;

    root.insertStyleSheet=insertStyleSheet;
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
        options.css=options.css.replace(/@\.([\w-]+)/g,replacer) as any;
    }

    (root as any).root=root;

    return root as any;
};



export class AtStyleSheet
{

}
