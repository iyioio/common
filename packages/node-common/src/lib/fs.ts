import { promises as fs } from 'node:fs';

export async function pathExistsAsync(path:string):Promise<boolean>
{
    try{
        await fs.access(path);
        return true;
    }catch{
        return false;
    }
}
