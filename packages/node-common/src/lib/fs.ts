import { isRooted } from '@iyio/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export const pathExistsAsync=async (path:string):Promise<boolean>=>
{
    try{
        await fs.access(path);
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
