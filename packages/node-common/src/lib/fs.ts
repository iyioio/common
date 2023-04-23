import { isRooted } from '@iyio/common';
import { accessSync } from 'node:fs';
import { access } from 'node:fs/promises';
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
