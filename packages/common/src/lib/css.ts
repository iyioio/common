
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

    const strAry:string[]=[strings[0]];

    for(let i=1;i<strings.length;i++){
        strAry.push(values[i-1]);
        strAry.push(strings[i]);
    }

    return strAry.join('');
}
