import { ChildProcess, ChildProcessWithoutNullStreams, exec, spawn } from 'node:child_process';

export interface ExecOptions
{
    /**
     * The command to run
     */
    cmd:string;

    /**
     * Current working directory
     */
    cwd?:string;

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
        cwd,
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
        exec(cmd,{cwd},(err,_stdout,_stderr)=>{
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

export interface SpawnOptions
{
    cmd:string;
    cwd?:string;
    out?:(value:string)=>void;
    outPrefix?:string;
    silent?:boolean;
    throwOnError?:boolean;
    stdout?:(...value:string[])=>void;
    stderr?:(...value:string[])=>void;
    onChild?:(proc:ChildProcess)=>void;
    onOutput?:(type:string,value:string)=>void;
    onError?:(type:string,value:string)=>void;
}

export const spawnAsync=(
    cmdOrOptions:SpawnOptions|string,
    _silent=false,
    _throwOnError=false
)=>{
    const options:SpawnOptions=typeof cmdOrOptions === 'string'?{
        cmd:cmdOrOptions,
        silent:_silent,
        throwOnError:_throwOnError,
    }:cmdOrOptions;

    const {
        cmd,
        cwd,
        out,
        silent=out?true:false,
        stdout=console.info,
        stderr=console.warn,
        onChild,
        onOutput,
        onError,
        outPrefix='',
        throwOnError
    }=options;

    return new Promise((r,j)=>{
        if(!silent){
            stdout('> '+cmd);
        }
        out?.('> '+cmd)
        let child:ChildProcessWithoutNullStreams|undefined=undefined;

        child=spawn(cmd,{cwd,shell:true});
        child.on('error',j);
        child.on('exit',code=>code?j(code):r(''));
        child.on('disconnect',()=>r(''));
        child.on('close',()=>r(''));
        child.stdout.setEncoding('utf8');
        child.stdout.on('data',(data)=>{
            if(typeof data !== 'string'){
                data=data?.toString()??''
            }
            if(onOutput){
                onOutput('out',data)
            }
            stdout(outPrefix?outPrefix+data:data);
        });
        child.stderr.setEncoding('utf8');
        child.stderr.on('data',(data)=>{
            if(typeof data !== 'string'){
                data=data?.toString()??''
            }
            if(onError){
                onError('err',data)
            }
            stderr(outPrefix?outPrefix+data:data);
            if(throwOnError){
                j(data);
                child?.kill();
            }
        });
        onChild?.(child)
    })
}
