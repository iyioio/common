/**
 * Replaces circular references when used as the replacer of the JSON.stringify function.
 * Do not reused the returned function. For each call to JSON.stringify create a new replacer
 * by calling createJsonRefReplacer.
 */
export const createJsonRefReplacer=()=>{

    const objs:any[]=[];

    return (key:string,value:any):any=>{
        if(value && (typeof value ==='object')){

            if(objs.includes(value)){
                return `[REF ${objs.indexOf(value)}]`
            }else{
                objs.push(value);
                return value;
            }
        }else{
            return value;
        }
    }
}
