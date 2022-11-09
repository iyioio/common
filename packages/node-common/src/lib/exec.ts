import { exec } from 'node:child_process';


export function execAsync(cmd:string,silent=false,ignoreErrors=false):Promise<string>
{
    return new Promise<string>((r,j)=>{
        if(!silent){
            console.info('> '+cmd);
        }
        exec(cmd,(error,stdout,stderr)=>{
            if(error){
                if(!silent){
                    console.error('| '+error);
                }
                if(ignoreErrors){
                    r('');
                }else{
                    j(error);
                }
            }else{
                if(!silent){
                    console.info('| '+stdout);
                    if(stderr){
                        console.warn('| '+stderr);
                    }
                }
                r(stdout?.trim()||'');
            }
        })
    })
}
