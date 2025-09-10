import { HashMap } from "./common-types.js";

export const stringToHashMap=(str:string):HashMap<string>=>{
    const hashMap:HashMap<string>={}
    if(!str){
        return hashMap;
    }
    const lines=str.split(/,;\n/);
    for(const line of lines){
        const parts=line.split(/:=/,2);
        const key=parts[0]?.trim()??'';
        if(key.startsWith('#')){
            continue;
        }
        hashMap[key]=parts[1]?.trim()??'';
    }
    return hashMap;
}
