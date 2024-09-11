import { Children } from "react";

export const getReactChildStrings=(children:any):string[]=>{
    if(typeof children === 'string'){
        return [children];
    }
    const strings:string[]=[];
    Children.forEach(children,c=>{
        if(typeof c === 'string'){
            strings.push(c);
        }
    })
    return strings;
}

export const getReactChildString=(children:any,join:string=' '):string|null=>{
    const ary=getReactChildStrings(children);
    return ary.length===0?null:ary.join(join);
}
