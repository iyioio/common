import { exec } from 'node:child_process';

export interface ExecOptions
{
    /**
     * The command to run
     */
    cmd:string;

    /**
     * Disables output to the stdout, stderr and onExecutionError, out is not effected.
     * @default false
     */
    silent?:boolean;

    /**
     * If true execution errors are ignored
     * @default false
     */
    ignoreErrors?:boolean;

    /**
     * Callback that receives all output, both std and stderr.
     */
    out?:(value:string)=>void;

    /**
     * Callback that receives stdout
     * @default console.info
     */
    stdout?:(value:string)=>void;

    /**
     * Callback that receives stderr
     * @default console.warn
     */
    stderr?:(value:string)=>void;

    /**
     * Callback that receives execution errors, NOT stderr.
     * @default console.error
     */
    onExecutionError?:(value:string)=>void;
}

interface execAsyncOverrides
{
    (options:ExecOptions):Promise<string>;
    (cmd:string,silent?:boolean,ignoreErrors?:boolean):Promise<string>;
}

export const execAsync:execAsyncOverrides=(
    cmdOrOptions:string|ExecOptions,
    _silent:boolean=false,
    _ignoreErrors:boolean=false
):Promise<string>=>{
    const options:ExecOptions=typeof cmdOrOptions === 'string'?{
        cmd:cmdOrOptions,
        silent:_silent,
        ignoreErrors:_ignoreErrors,
    }:cmdOrOptions;

    const {
        cmd,
        out,
        silent=out?true:false,
        ignoreErrors=false,
        stdout=console.info,
        stderr=console.warn,
        onExecutionError=console.error,
    }=options;

    return new Promise<string>((r,j)=>{
        if(!silent){
            stdout('> '+cmd);
        }
        out?.('> '+cmd)
        exec(cmd,(err,_stdout,_stderr)=>{
            if(err){
                if(!silent){
                    onExecutionError('| '+err);
                }
                out?.('| '+err);
                if(ignoreErrors){
                    r('');
                }else{
                    j(err);
                }
            }else{
                if(!silent){
                    stdout('| '+_stdout);
                }
                out?.('| '+_stdout);
                if(_stderr){
                    if(!silent){
                        stderr('| '+_stderr);
                    }
                    out?.('| '+_stderr);
                }

                r(_stdout?.trim()||'');
            }
        })
    })
}
