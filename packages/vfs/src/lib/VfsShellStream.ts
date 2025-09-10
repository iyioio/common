import { createPromiseSource, delayAsync, shortUuid } from "@iyio/common";
import { Observable, Subject } from "rxjs";
import { VfsCtrl } from "./VfsCtrl.js";
import { VfsShellCommand } from "./vfs-types.js";

export class VfsShellStream
{
    private readonly exitPromiseSource=createPromiseSource<number>();
    public get exitPromise(){return this.exitPromiseSource.promise}

    private readonly _onOutput=new Subject<string[]>();
    public get onOutput():Observable<string[]>{return this._onOutput}

    private readonly _onErr=new Subject<string[]>();
    public get onErr():Observable<string[]>{return this._onErr}

    private _exitCode?:number;
    public get exitCode(){return this._exitCode}

    public pipeId:string;

    public readonly options:VfsShellCommand;

    private readonly ctrl:VfsCtrl;

    public constructor(ctrl:VfsCtrl,options:VfsShellCommand){
        this.pipeId=options.outputStreamId??shortUuid();
        this.options=options;
        this.ctrl=ctrl;

        ctrl.execShellCmdAsync({
            ...options,
            outputStreamId:this.pipeId,
            returnImmediately:true,
        });

        ctrl.getPipeOutputAsync(options.cwd,this.pipeId,true).then(this.onPipe)

    }

    private readonly onPipe=(out:Record<string,string[]>|undefined)=>{
        if(!out){
            delayAsync(50).then(()=>{
                this.ctrl.getPipeOutputAsync(this.options.cwd,this.pipeId,true).then(this.onPipe);
            })
            return;
        }
        let o=out['out'];
        if(o){
            this._onOutput.next(o);
        }
        o=out['err'];
        if(o){
            this._onErr.next(o);
        }
        o=out['exit'];
        if(o){
            this._exitCode=Number(o[0]??'0');
            this.exitPromiseSource.resolve(this._exitCode);
        }else{
            this.ctrl.getPipeOutputAsync(this.options.cwd,this.pipeId,true).then(this.onPipe);
        }

    }

    public async writeAsync(text:string):Promise<boolean>
    {
        return this.ctrl.writeToPipeAsync(this.options.cwd,this.pipeId,text);
    }

    public async writeLineAsync(text:string):Promise<boolean>
    {
        return this.ctrl.writeToPipeAsync(this.options.cwd,this.pipeId,text+'\n');
    }

    public write(text:string):void
    {
        this.ctrl.writeToPipeAsync(this.options.cwd,this.pipeId,text);
    }

    public writeLine(text:string):void
    {
        this.ctrl.writeToPipeAsync(this.options.cwd,this.pipeId,text+'\n');
    }

}
