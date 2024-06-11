import { CancelToken, isRooted } from '@iyio/common';
import { Abortable } from 'node:events';
import { OpenMode, PathLike, accessSync, statSync } from 'node:fs';
import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';

export const pathExistsAsync=async (path:string):Promise<boolean>=>
{
    try{
        await access(path);
        return true;
    }catch{
        return false;
    }
}

export const pathExistsSync=(path:string):boolean=>
{
    try{
        accessSync(path);
        return true;
    }catch{
        return false;
    }
}

export const getFullPath=(path:string)=>{
    if(isRooted(path) || !globalThis.process?.cwd){
        return path;
    }else{
        return join(process.cwd(),path);
    }
}

export const isDirAsync=async (path:string):Promise<boolean|null>=>{
    try{
        const s=await stat(path);
        return s.isDirectory();
    }catch{
        return null;
    }
}

export const isDirSync=(path:string):boolean|null=>{
    try{
        const stat=statSync(path);
        return stat.isDirectory();
    }catch{
        return null;
    }
}

export type ReadDirInclude='file'|'dir'|'both';
export interface ReadDirOptions
{
    path:string;
    recursive?:boolean;
    test?:(path:string)=>boolean;
    filter?:RegExp;
    outputs?:string[];
    include?:ReadDirInclude;
    forEach?:(path:string)=>void|Promise<void>
    /**
     * If true full absolute paths are returned, otherwise paths are relative to the path supplied.
     */
    fullPath?:boolean;
}

export const readDirAsync=async (options:ReadDirOptions,cancel?:CancelToken):Promise<string[]>=>{

    const {
        path,
        recursive,
        test,
        outputs=[],
        include='both',
        filter,
        fullPath,
        forEach,
    }=options;

    const result=await readdir(path);
    cancel?.throwIfCanceled();

    for(const r of result){
        const rPath=fullPath?await realpath(join(path,r)):join(path,r);
        let type:ReadDirInclude='both';
        if(recursive || include!=='both'){
            const s=await stat(rPath);
            cancel?.throwIfCanceled();
            type=s.isDirectory()?'dir':'file';
        }

        if((include==='both' || type===include) && (!filter || filter.test(rPath)) && (!test || test(rPath))){
            outputs.push(rPath);
        }

        if(forEach){
            await forEach(rPath);
        }

        if(recursive && type==='dir'){
            await readDirAsync({
                ...options,
                fullPath:false,
                path:rPath,
                outputs,
            },cancel);
            cancel?.throwIfCanceled();
        }
    }

    return outputs;

}

export type ReadFileOptions={encoding?:null|undefined;flag?:OpenMode|undefined;}&Abortable

export const readFileAsStringAsync=async (
    path:PathLike,
    options?:ReadFileOptions|null
):Promise<string>=>{
    return (await readFile(path,options)).toString();
}

export const readFileAsJsonAsync=async <T>(
    path:PathLike,
    options?:ReadFileOptions|null
):Promise<T>=>{
    const json=await readFileAsStringAsync(path,options);
    return JSON.parse(json);
}

export const readStdInAsStringAsync=():Promise<string>=>{
    return new Promise<string>((r)=>{
        const chucks:string[]=[];
        const onData=(data:any)=>{
            if(typeof data === 'string'){
                chucks.push(data);
            }else{
                try{
                    chucks.push(data?.toString()??'');
                }catch{
                    //
                }
            }
        }
        const onEnd=()=>{
            process.stdin.removeListener('data',onData);
            process.stdin.removeListener('end',onEnd);
            r(chucks.join(''));
        }

        process.stdin.addListener('data',onData);
        process.stdin.addListener('end',onEnd);
    });
}
