import { CancelToken } from '@iyio/common';
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

const consoleInfo=(...value:string[]):void=>{
    if(value.length===1){
        let v=value[0];
        if(v?.endsWith('\n')){
            v=v.substring(0,v.length-1);
        }
        console.info(v);
    }else{
        console.info(...value);
    }
}
const consoleWarn=(...value:string[]):void=>{
    if(value.length===1){
        let v=value[0];
        if(v?.endsWith('\n')){
            v=v.substring(0,v.length-1);
        }
        console.warn(v);
    }else{
        console.warn(...value);
    }
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
    onExit?:(code:number)=>void;
    cancel?:CancelToken;
    logPid?:boolean;
}

export const spawnAsync=(
    cmdOrOptions:SpawnOptions|string,
    _silent=false,
    _throwOnError=false,
):Promise<string>=>{
    const options:SpawnOptions=typeof cmdOrOptions === 'string'?{
        cmd:cmdOrOptions,
        silent:_silent,
        throwOnError:_throwOnError,
    }:cmdOrOptions;

    const {
        cmd,
        cwd,
        out,
        silent,
        stdout=consoleInfo,
        stderr=consoleWarn,
        onChild,
        onOutput,
        onError,
        outPrefix='',
        throwOnError,
        onExit,
        cancel,
        logPid,
    }=options;

    return new Promise<string>((r,j)=>{

        let child:ChildProcessWithoutNullStreams|undefined=undefined;

        try{
            child=spawn(cmd,{cwd,shell:true});
            if(logPid){
                if(!silent){
                    stdout(`pid(${child.pid}) > `+cmd);
                }
                out?.(`pid(${child.pid}) > `+cmd)
            }else{
                if(!silent){
                    stdout('> '+cmd);
                }
                out?.('> '+cmd)
            }
        }finally{
            if(!child){
                if(!silent){
                    stdout('> '+cmd);
                }
                out?.('> '+cmd)
            }
        }
        child.on('error',err=>{
            if(throwOnError){
                j(err);
            }
        });
        child.on('exit',code=>{
            if(logPid){
                if(!silent){
                    stdout(`pid(${child?.pid}) > # exit(${code}) -- `+cmd);
                }
                out?.(`pid(${child?.pid}) > # exit(${code}) -- `+cmd)
            }
            onExit?.(code??0);
            if(code && throwOnError){
                j(code);
            }else{
                r('');
            }
        });
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
            out?.(data);
            if(!silent){
                stdout(outPrefix?outPrefix+data:data);
            }
        });
        child.stderr.setEncoding('utf8');
        child.stderr.on('data',(data)=>{
            if(typeof data !== 'string'){
                data=data?.toString()??''
            }
            if(onError){
                onError('err',data)
            }
            out?.(data);
            stderr(outPrefix?outPrefix+data:data);
            if(throwOnError){
                j(data);
                child?.kill();
            }
        });
        onChild?.(child);
        cancel?.onCancelOrNextTick(()=>{
            try{
                child?.kill();
            }catch{
                // do nothing
            }
        });
    })
}
