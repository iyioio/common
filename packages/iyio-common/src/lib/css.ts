
export type ClassNameValue=string|false|number|null|undefined|{[className:string]:any}|ClassNameValue[];
/**
 * Joins classes names together. Falsy values are ignored. Values can also be arrays of class name
 * values recursively or objects where the keys of the object will be used as class names if the
 * value to corresponds to the key is not falsy.
 */
export const cn=(...classNames:ClassNameValue[]):string=>{
    let className='';

    for(const c of classNames){
        if(!c){
            continue;
        }

        switch(typeof c){
            case 'string':
                className+=className?' '+c:c;
                break;

            case 'object':
                if(Array.isArray(c)){
                    const n=cn(...c);
                    if(n){
                        className+=className?' '+n:n;
                    }
                }else if(c){
                    for(const e in c){
                        if(c[e]){
                            className+=className?' '+e:e;
                        }
                    }
                }
            break;
        }
    }

    return className;
}

/**
 * Used for syntax highlighting
 */
export const css=(strings:TemplateStringsArray,...values:any[])=>{
    if(strings.length===1){
        return strings[0];
    }

    const strAry:string[]=[strings[0] as string];

    for(let i=1;i<strings.length;i++){
        strAry.push(values[i-1]);
        strAry.push(strings[i] as string);
    }

    return strAry.join('');
}

export const percentToCssHex=(n:number)=>Math.floor(n*255).toString(16).padStart(2,'0');

export const convertRgbToHex=(rgb:string|null|undefined):string|undefined=>{

    if(!rgb){
        return undefined;
    }

    const match=/^\s*rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,?\s*([\d.]+)?\s*\)\s*$/i.exec(rgb);
    if(!match){
        if(rgb.trim().startsWith('#')){
            return rgb.trim().toLowerCase();
        }
        return undefined;
    }

    const r=Math.round(Math.max(0,Math.min(255,Number(match[1]))));
    const g=Math.round(Math.max(0,Math.min(255,Number(match[2]))));
    const b=Math.round(Math.max(0,Math.min(255,Number(match[3]))));
    const a=match[4]?Math.max(0,Math.min(1,Number(match[4]))):Number.NaN;

    if(!isFinite(r) || !isFinite(g) || !isFinite(b)){
        return undefined;
    }

    if(isFinite(a)){
        return `#${
            r.toString(16).padStart(2,'0')
        }${
            g.toString(16).padStart(2,'0')
        }${
            b.toString(16).padStart(2,'0')
        }${
            Math.round(a*255).toString(16).padStart(2,'0')
        }`.toLowerCase();
    }else{
        return `#${
            r.toString(16).padStart(2,'0')
        }${
            g.toString(16).padStart(2,'0')
        }${
            b.toString(16).padStart(2,'0')
        }`.toLowerCase();
    }

}
