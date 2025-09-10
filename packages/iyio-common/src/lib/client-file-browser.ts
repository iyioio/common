import { ZodSchema } from "zod";
import { CancelToken } from "./CancelToken.js";
import { createPromiseSource } from "./PromiseSource.js";
import { readBlobAsStringAsync } from "./file-reader.js";

export interface BrowseFileOptions
{
    accept?:string;
    cancel?:CancelToken;
    multiple?:boolean;
}
export const browseForFilesAsync=async ({
    accept,
    cancel,
    multiple,
}:BrowseFileOptions={}):Promise<File[]>=>{
    const input=globalThis.document?.createElement('input');
    if(!input){
        return [];
    }

    const src=createPromiseSource<File[]>();

    const dispose=()=>{
        input.remove();
        if(src.getStatus()==='waiting'){
            src.resolve([]);
        }
    }
    cancel?.subscribe(dispose);

    input.style.opacity='0';
    input.style.position='absolute';
    input.style.transform='translate(-1000px,-1000px)';
    input.type='file';
    if(accept){
        input.accept=accept;
    }
    if(multiple){
        input.multiple=true;
    }
    input.addEventListener('change',e=>{
        const files=Array.from(input.files??[]);
        src.resolve(files);
    })
    input.addEventListener('cancel',dispose);
    globalThis.document.body.append(input);

    input.click();

    return await src.promise;

}

export const browseForStringsAsync=async (options:BrowseFileOptions):Promise<string[]>=>{
    const files=await browseForFilesAsync(options);
    const strings=await Promise.all(files.map(f=>readBlobAsStringAsync(f)));
    return strings.filter(s=>s!==undefined) as string[];
}

export const browseParseErrorKey=Symbol('browseParseErrorKey');
export interface BrowseParseError
{
    [browseParseErrorKey]:true;
    json:string;
    error:any;
}
export const isBrowseParseError=(value:any):value is BrowseParseError=>{
    return value?.[browseParseErrorKey]===true;
}
export interface BrowseObjectOptions extends BrowseFileOptions{
    catchParsingErrors?:boolean;
    scheme?:ZodSchema;
}
export const browseForObjectsAsync=async ({
    catchParsingErrors,
    scheme,
    ...options
}:BrowseObjectOptions={}):Promise<any[]>=>{
    const files=await browseForFilesAsync(options);
    const strings=await Promise.all(files.map(async f=>{
        const json=await readBlobAsStringAsync(f);
        if(!json?.trim()){
            return undefined;
        }
        if(catchParsingErrors || scheme){
            try{
                const v=JSON.parse(json);
                if(scheme){
                    return scheme.parse(v);
                }else{
                    return v;
                }
            }catch(ex){
                const err:BrowseParseError={
                    [browseParseErrorKey]:true,
                    json,
                    error:ex,
                }
                return err;
            }
        }else{
            return JSON.parse(json);
        }
    }));
    return strings.filter(s=>s!==undefined) as string[];
}
