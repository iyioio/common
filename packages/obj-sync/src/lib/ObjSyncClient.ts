import { ObjMirror, ObjWatchEvt, ObjWatcher, PromiseSource, ReadonlySubject, RecursiveObjWatchEvt, asArray, createPromiseSource, objWatchEvtSourceKey, objWatchEvtToRecursiveObjWatchEvt, stopWatchingObj, watchObj } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { ObjSyncClientCommand, ObjSyncClientCommandScheme, ObjSyncRecursiveObjWatchEvt, ObjSyncRemoteCommand, ScopedObjSyncRemoteCommand } from "./obj-sync-types";

const objEvtSource=Symbol('objEvtSource');

export interface ObjSyncClientOptions
{
    objId:string;
    clientId:string;
    state:Record<string,any>;
    maxCommandQueueSeconds?:number;
    maxCommandQueueSize?:number;
    clientMapProp?:string;
    autoDeleteClientObjects?:boolean;
    pingIntervalMs?:number;
}

export abstract class ObjSyncClient
{

    public readonly objId:string;

    public readonly clientId:string;

    private _changeIndex:number|null=null;

    public get changeIndex(){return this._changeIndex}

    public readonly state:Record<string,any>;

    public readonly watcher:ObjWatcher<any>;

    private readonly mirror:ObjMirror;

    private readonly maxCommandQueueSeconds:number;

    protected readonly pingIntervalMs?:number;

    public logCommands=false;

    private readonly maxCommandQueueSize:number;
    private readonly clientMapProp?:string;
    private readonly autoDeleteClientObjects?:boolean;

    private readonly _isReady:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get isReadySubject():ReadonlySubject<boolean>{return this._isReady}
    public get isReady(){return this._isReady.value}

    private readySource:PromiseSource<void>=createPromiseSource<void>();

    public constructor({
        objId,
        clientId,
        state,
        maxCommandQueueSeconds=20,
        maxCommandQueueSize=100,
        clientMapProp,
        autoDeleteClientObjects,
        pingIntervalMs,
    }:ObjSyncClientOptions){
        this.objId=objId;
        this.clientId=clientId;
        this.state=state;
        this.maxCommandQueueSeconds=maxCommandQueueSeconds;
        this.maxCommandQueueSize=maxCommandQueueSize;
        this.clientMapProp=clientMapProp;
        this.autoDeleteClientObjects=autoDeleteClientObjects;
        this.pingIntervalMs=pingIntervalMs;
        const watcher=watchObj(state);
        if(!watcher){
            throw new Error('Unable to get or create watcher for target state object');
        }
        this.watcher=watcher;
        this.mirror=new ObjMirror(state,true);

        watcher.addRecursiveListener(this.onWatcherEvent);
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.watcher.removeRecursiveListener(this.onWatcherEvent);
        stopWatchingObj(this.state);
        this.mirror.dispose();
        this._dispose();
    }

    protected _dispose(){
        //
    }

    private onWatcherEvent=(obj:any,evt:ObjWatchEvt<any>,path:(string|number|null)[])=>{
        if(evt[objWatchEvtSourceKey]===objEvtSource || evt.type==='load' || this._isDisposed){
            return;
        }
        const rEvt=objWatchEvtToRecursiveObjWatchEvt(evt,path) as ObjSyncRecursiveObjWatchEvt;
        this.send({type:'evt',evts:[rEvt]});
    }

    private sendQueue:ObjSyncRemoteCommand[]=[];

    public send(cmd:ScopedObjSyncRemoteCommand|ScopedObjSyncRemoteCommand[])
    {
        if(this.logCommands){
            console.info('>> obj-sync SND',...asArray(cmd));
        }
        if(this._isDisposed){
            return;
        }
        if(!Array.isArray(cmd)){
            cmd=[cmd];
        }
        if(!cmd.length){
            return;
        }
        this._sendCount+=cmd.length;
        const initSend=this.sendQueue.length===0;

        for(const c of cmd){
            const last=this.sendQueue[this.sendQueue.length-1];
            if(last?.type==='evt' && c.type==='evt' && last.evts && c.evts){
                last.evts.push(...c.evts);
            }else{
                this.sendQueue.push({
                    ...c,
                    clientId:this.clientId,
                    objId:this.objId,
                })
            }
        }
        if(initSend){
            setTimeout(()=>{
                if(this.isDisposed){
                    return;
                }
                const q=this.sendQueue;
                this.sendQueue=[];
                this._send(q);
            },0);
        }
    }

    private _sendCount=0;
    public get sendCount(){return this._sendCount}

    protected abstract _send(cmds:ObjSyncRemoteCommand[]):Promise<void>|void;

    private connectPromise:Promise<void>|null=null;

    public async connectAsync(connectWithDefaultState?:boolean)
    {
        if(this._isDisposed){
            return;
        }

        if(!this.connectPromise){
            this.connectPromise=this.connectInitAsync(connectWithDefaultState);
        }
        await this.connectPromise;
        await this.readySource.promise;
    }

    private async connectInitAsync(connectWithDefaultState?:boolean)
    {
        await this._connectAsync();
        this.send([{type:'createClient'},{
            type:'get',
            defaultState:connectWithDefaultState?this.state:undefined,
            clientMapProp:this.clientMapProp,
            autoDeleteClientObjects:this.autoDeleteClientObjects,
        }]);
        this.pingLoop();
    }

    protected abstract _connectAsync():Promise<void>;

    protected pingLoop()
    {
        if(this.pingIntervalMs===undefined){
            return;
        }
        const iv=setInterval(()=>{
            if(this.isDisposed){
                clearInterval(iv);
                return;
            }
            this.send({type:'ping'})
        },this.pingIntervalMs)
    }

    protected handleError(error:any){

        console.error('ObjSyncClient error',error);
        this.dispose();
    }

    protected handleCommand(command:ObjSyncClientCommand|ObjSyncClientCommand[])
    {
        if(this.logCommands){
            console.info('<< obj-sync RCV',...asArray(command));
        }
        if(this._isDisposed){
            return;
        }

        if(Array.isArray(command)){
            for(const cmd of command){
                const parseResult=ObjSyncClientCommandScheme.safeParse(cmd);
                if(!parseResult.success){
                    this.handleError(parseResult.error);
                    return;
                }
            }
            this.watcher.requestQueueChanges();
            try{
                for(const cmd of command){
                    this._handleCommand(cmd);
                }
            }finally{
                this.watcher.requestDequeueChanges();
            }
            return;
        }else{

            const parseResult=ObjSyncClientCommandScheme.safeParse(command);
            if(!parseResult.success){
                this.handleError(parseResult.error);
                return;
            }
            this.watcher.requestQueueChanges();
            try{
                this._handleCommand(command);
            }finally{
                this.watcher.requestDequeueChanges();
            }
        }
    }

    private cmdQueue:ObjSyncClientCommand[]=[];
    private cmdQueueTTL:number|null=null;

    private queueCmd(command:ObjSyncClientCommand)
    {
        if(this.cmdQueueTTL===null){
            this.cmdQueueTTL=Date.now()+(this.maxCommandQueueSeconds*1000);
        }else if(this.cmdQueueTTL>Date.now()){
            this.handleError('command queue ttl reached');
            return;
        }else if(this.cmdQueue.length>this.maxCommandQueueSize){
            this.handleError('command queue size limit reached');
            return;
        }

        this.cmdQueue.push({...command});
    }

    private flushCommandQueue()
    {
        if(!this.cmdQueue.length){
            return;
        }
        const queue=this.cmdQueue;
        this.cmdQueue=[];

        queue.sort((a,b)=>a.changeIndex-b.changeIndex);
        if(queue[0]?.changeIndex!==(this._changeIndex??0)+1){
            this.handleError('Flushed command queue change index invalid');
            return;
        }

        for(const cmd of queue){
            this._handleCommand(cmd);
        }

    }

    private _handleCommand(command:ObjSyncClientCommand)
    {
        if(command.type==='reset'){
            this.dispose();
            return;
        }else if(command.type==='pong'){
            return;
        }

        if(this._changeIndex===null){
            if(command.type!=='set'){
                this.queueCmd(command);
                return;
            }
        }else{
            if(command.changeIndex<=this._changeIndex){
                return;
            }

            if(command.changeIndex!==this._changeIndex+1){
                this.queueCmd(command);
                return;
            }
        }

        if(this.cmdQueue.length){
            this.cmdQueue.push(command);
            this.flushCommandQueue();
            return;
        }

        this._changeIndex=command.changeIndex;

        switch(command.type){

            case 'evt':
                if(command.evts){
                    for(const evt of command.evts){
                        this.mirror.handleEvent(evt,objEvtSource);
                    }
                }else{
                    this.handleError('command.evts missing');
                    break;
                }
                break;

            case 'delete':
                this.deleteState();
                break;


            case 'set':
                if(command.state){
                    if(command.state.objId!==this.objId){
                        this.handleError('command.state.objId mismatch');
                        return;
                    }
                    this._changeIndex=command.changeIndex;
                    this.setStateWithLogs(command.state.state,command.state.log as RecursiveObjWatchEvt<any>[]);
                }
                break;

        }

        if(command.type==='set' && !this._isReady.value){
            this._isReady.next(true);
            this.readySource.resolve();
        }
    }

    public setState(obj:Record<string,any>)
    {
        this.setStateWithLogs(obj,[]);
    }

    private setStateWithLogs(obj:Record<string,any>,log:RecursiveObjWatchEvt<any>[])
    {
        this.watcher.requestQueueChanges();
        try{
            for(const e in this.state){
                this.watcher.deleteProp(e,objEvtSource);
            }
            for(const e in obj){
                this.watcher.setProp(e,obj[e],objEvtSource);
            }
            for(const e of log){
                this.mirror.handleEvent(e,objEvtSource);
            }
        }finally{
            this.watcher.requestDequeueChanges();
        }
    }

    private deleteState()
    {
        this.watcher.requestQueueChanges();
        try{
            for(const e in this.state){
                this.watcher.deleteProp(e,objEvtSource);
            }
        }finally{
            this.watcher.requestDequeueChanges();
        }
    }
}
