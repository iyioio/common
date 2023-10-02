import { AtCssOptions, AtCssOptionsDefaults, BaseLayoutProps, ClassNameValue, ParseAtSheet, bcn, cn, getStyleSheetOrder } from "@iyio/common";

const orderAtt='data-at-dot-css-order';

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

        const id='at-dot-css-'+name
        globalThis.document.getElementById(id)?.remove();

        const order=getStyleSheetOrder(options.order);

        const style=globalThis.document.createElement('style');
        style.id=id;
        style.setAttribute(orderAtt,order.toString());
        style.innerHTML=options.css.replace(
            /\W(backdrop-filter)\s*:([^;}:]*)/gim,
            (match,prop,value)=>`${match};-webkit-${prop}:${value}`);

        (options as any).css='';

        const styles=globalThis.document.head.querySelectorAll(`style[${orderAtt}]`);

        for(let i=0;i<styles.length;i++){
            const existingStyle=styles.item(i);
            if(!existingStyle){
                continue;
            }

            const o=Number(existingStyle.getAttribute(orderAtt));
            if(isFinite(o) && order<o){
                globalThis.document.head.insertBefore(style,existingStyle);
                return;
            }
        }

        const before=globalThis.document.head.querySelector('link,style');
        if(before){
            globalThis.document.head.insertBefore(style,before);
        }else{
            globalThis.document.head.append(style);
        }

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
