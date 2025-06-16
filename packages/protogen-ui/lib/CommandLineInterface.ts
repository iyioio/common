import { ConsoleEntry, addConsoleListener, delayAsync, removeConsoleListener } from "@iyio/common";
import { ProtogenCtrl } from "./ProtogenCtrl";

const cliKey='protogen-cli-history';
const maxHistory=1000;

export class CommandLineInterface
{

    public readonly ctrl:ProtogenCtrl;

    public readonly cmdHistory:string[]=[];

    public constructor(ctrl:ProtogenCtrl)
    {
        this.ctrl=ctrl;

        addConsoleListener(this.consoleListener);

        const history=globalThis.localStorage?.getItem(cliKey);
        if(history){
            try{
                const ary=JSON.parse(history);
                if(Array.isArray(ary)){
                    this.cmdHistory=ary.filter(c=>typeof c === 'string');
                }
            }catch(ex){
                console.error('Invalid cli history state',ex);
            }
        }

    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        removeConsoleListener(this.consoleListener);
    }

    public addToHistory(cmd:string)
    {
        this.cmdHistory.push(cmd);
        while(this.cmdHistory.length>maxHistory){
            this.cmdHistory.splice(0,100);
        }
        globalThis.localStorage?.setItem(cliKey,JSON.stringify(this.cmdHistory))
    }

    private readonly consoleListener=(entry:ConsoleEntry)=>{
        this.log(...entry.args);
    }

    public run(cmd:string){
        this.runCmdAsync(cmd);
    }

    public async runCmdAsync(cmd:string):Promise<any>{

        cmd=cmd.trim();

        if(this.cmdHistory[this.cmdHistory.length-1]!==cmd){
            this.addToHistory(cmd);

        }

        if(cmd.startsWith('.')){
            cmd='ci'+cmd;
        }

        let match=/^(\w+)\s+(.*)/.exec(cmd);
        if(match){
            cmd=`ci.${match[1]}(${JSON.stringify(match[2])});`
        }else if(match=/^\w+$/.exec(cmd)){
            cmd=`ci.${match[0]}();`
        }

        try{
            let p=eval(`
                ((ci,ctrl,assistant,log)=>{
                    return ${cmd};
                })(this,this.ctrl,this.ctrl.assistant,console.log)
            `);
            if(p?.then){
                this.log('...running...')
                p=await p;
                if(p===undefined){
                    p='done';
                }
            }
            if(p!==undefined){
                this.log(p);
            }
            return p;
        }catch(ex){
            console.error(`run cmd failed. Cmd=${cmd}`,ex);
        }
        return undefined;
    }

    public log(...args:any[]){
        this.ctrl.appendOutput('\n'+args.map((v)=>{
            if(v===null){
                return 'null';
            }
            if(typeof v === 'object'){
                try{
                    return JSON.stringify(v,null,4);
                }catch{
                    //
                }
            }
            return v;

        }).join('\n'));
    }

    public delay(ms:number){
        return delayAsync(ms);
    }

    public async add(type:string)
    {
        const ctrls=await this.ctrl.addNewMarkdownNodesInViewportAsync(`## ${type}`);

        return `${ctrls.length} node(s) generated:\n${ctrls.map(n=>n.node.name).join('\n')}`;
    }

    public async save(){
        await this.ctrl.saveAsync();
        return 'Saved';
    }

    public async execute(){
        await this.ctrl.saveAsync({executePipeline:true});
        return 'Executed';
    }


}
