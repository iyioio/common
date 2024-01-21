import { ObjMirror, ObjWatchEvt, ObjWatcher, PromiseSource, ReadonlySubject, RecursiveObjWatchEvt, addObjMirroringPauseCallback, asArray, createPromiseSource, deepClone, delayAsync, getValueByAryPath, isObjPathMirroringPaused, objWatchEvtSourceKey, objWatchEvtToRecursiveObjWatchEvt, stopWatchingObj, watchObj } from "@iyio/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { ObjSyncClientCommand, ObjSyncClientCommandScheme, ObjSyncConnectionState, ObjSyncObjState, ObjSyncRecursiveObjWatchEvt, ObjSyncRemoteCommand, ObjSyncRemoteCommandScheme, ScopedObjSyncRemoteCommand, isObjSyncClientCommand, objSyncBroadcastClientId } from "./obj-sync-types";

export enum ObjSyncClientLogLevel{
    none=0,
    all=1,
    commands=2,
    queue=4,
    ping=8,
}

const logAllOrCommands=ObjSyncClientLogLevel.all|ObjSyncClientLogLevel.commands;
const logAllOrQueue=ObjSyncClientLogLevel.all|ObjSyncClientLogLevel.queue;

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
    reconnectTimeoutMs?:number;
    /**
     * How long to delay before sending commands. Delaying sending command allow commands to
     * be sent together as a group.
     * @default 1
     */
    sendDelayMs?:number;

    /**
     * If true queued events that set the same prop will be merged
     */
    mergeEvents?:boolean;

    /**
     * If true the client will act as a host and respond to remote commands
     */
    isHost?:boolean;

    disabledAutoReconnect?:boolean;
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

    private readonly sendDelayMs:number;

    private readonly mergeEvents:boolean;

    public readonly isHost:boolean;

    private readonly objEvtSource:symbol;

    public logCommands:ObjSyncClientLogLevel=ObjSyncClientLogLevel.none;

    private readonly maxCommandQueueSize:number;
    private readonly reconnectTimeoutMs:number;
    private readonly disabledAutoReconnect:boolean;
    private readonly clientMapProp?:string;
    private readonly autoDeleteClientObjects?:boolean;

    private readonly _isReady:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get isReadySubject():ReadonlySubject<boolean>{return this._isReady}
    public get isReady(){return this._isReady.value}

    private readonly _connectionState:BehaviorSubject<ObjSyncConnectionState>=new BehaviorSubject<ObjSyncConnectionState>('waiting');
    public get connectionStateSubject():ReadonlySubject<ObjSyncConnectionState>{return this._connectionState}
    public get connectionState(){return this._connectionState.value}

    private readonly _onReconnected=new Subject<void>();
    public get onReconnected():Observable<void>{return this._onReconnected}

    private readonly _onDisposed=new Subject<void>();
    public get onDisposed():Observable<void>{return this._onDisposed}

    private readySource:PromiseSource<void>=createPromiseSource<void>();

    public constructor({
        objId,
        clientId,
        state,
        maxCommandQueueSeconds=20,
        maxCommandQueueSize=300,
        reconnectTimeoutMs=30000,
        disabledAutoReconnect=false,
        clientMapProp,
        autoDeleteClientObjects,
        pingIntervalMs,
        sendDelayMs=1,
        mergeEvents=false,
        isHost=false,
    }:ObjSyncClientOptions){
        this.objEvtSource=Symbol('objEvtSource');
        this.objId=objId;
        this.clientId=clientId;
        this.state=state;
        this.maxCommandQueueSeconds=maxCommandQueueSeconds;
        this.maxCommandQueueSize=maxCommandQueueSize;
        this.reconnectTimeoutMs=reconnectTimeoutMs;
        this.disabledAutoReconnect=disabledAutoReconnect;
        this.clientMapProp=clientMapProp;
        this.autoDeleteClientObjects=autoDeleteClientObjects;
        this.pingIntervalMs=pingIntervalMs;
        this.sendDelayMs=Math.max(0,sendDelayMs);
        this.mergeEvents=mergeEvents;
        this.isHost=isHost;
        this.hostState={
            objId,
            changeIndex:0,
            state,
            log:[],
        }
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
        this._connectionState.next('closed');
        this._onDisposed.next();
    }

    protected _dispose(){
        // do nothing
    }

    protected _pingLost(){
        // do nothing
    }

    private readonly onWatcherEvent=(obj:any,evt:ObjWatchEvt<any>,path:(string|number|null)[])=>{
        if( evt[objWatchEvtSourceKey]===this.objEvtSource ||
            evt.type==='load' ||
            this._isDisposed)
        {
            return;
        }
        const rEvt=objWatchEvtToRecursiveObjWatchEvt(evt,path) as ObjSyncRecursiveObjWatchEvt;
        if(rEvt.path && isObjPathMirroringPaused(this.state,rEvt.path)){
            const target=getValueByAryPath(this.state,rEvt.path);
            this.queueObjCmd(target,rEvt);
            addObjMirroringPauseCallback(target,this.onMirroringResume);
            return;
        }
        this.send({type:'evt',evts:[rEvt]});
    }

    private readonly onMirroringResume=(obj:any)=>{
        const queue=this.dequeueObjCmdQueue(obj);
        if(!queue){
            return;
        }
        this.send({type:'evt',evts:queue});
    }

    private sendQueue:ObjSyncRemoteCommand[]=[];

    public send(cmd:ScopedObjSyncRemoteCommand|ScopedObjSyncRemoteCommand[])
    {
        if( (this.logCommands&logAllOrCommands) &&
            ((this.logCommands&ObjSyncClientLogLevel.ping) || !areAllPings(cmd))
        ){
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
                if(this.logCommands&logAllOrQueue){
                    console.info('>> merge');
                }
                if(this.mergeEvents){
                    mergeEvents(c.evts,last.evts);
                }else{
                    last.evts.push(...c.evts);
                }
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
                if(this.isDisposed && !this.sendQueue.length){
                    return;
                }
                const q=this.sendQueue;
                this.sendQueue=[];
                if(this.logCommands&logAllOrQueue){
                    console.info('>> send');
                }
                this.sendRemoteCommands(q);
            },this.sendDelayMs);
        }
    }

    private _sendCount=0;
    public get sendCount(){return this._sendCount}

    private readonly skipApply=Symbol('skipApply');

    private sendClientCommands(cmds:ObjSyncClientCommand[],handled=false)
    {
        if(this.isHost){
            cmds=deepClone(cmds);
            const selfCommands:ObjSyncClientCommand[]=[];
            const clientCommands:ObjSyncClientCommand[]=[];
            for(const c of cmds){
                if(c.clientId===this.clientId){
                    if(handled){
                        (c as any)[this.skipApply]=true;
                    }
                    selfCommands.push(c);
                }else if(c.clientId===objSyncBroadcastClientId){
                    if(handled){
                        (c as any)[this.skipApply]=true;
                    }
                    selfCommands.push(c);
                    clientCommands.push(c);
                }else{
                    clientCommands.push(c);
                }
            }
            if(selfCommands.length){
                this.handleCommand(selfCommands,true);
            }
            if(clientCommands.length){
                this._send(clientCommands);
            }
        }else{
            this._send(cmds);
        }
    }

    private sendRemoteCommands(cmds:ObjSyncRemoteCommand[])
    {
        if(this.isHost){
            cmds=deepClone(cmds);
            setTimeout(()=>{
                this.handleCommand(cmds,true);
            },0)
        }else{
            this._send(cmds);
        }
    }

    protected abstract _send(cmds:(ObjSyncRemoteCommand|ObjSyncClientCommand)[]):Promise<void>|void;

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
        this._connectionState.next('connecting');
        await this._connectAsync();
        this._connectionState.next('connected');
        this.send([{type:'createClient'},{
            type:'get',
            defaultState:connectWithDefaultState?this.state:undefined,
            clientMapProp:this.clientMapProp,
            autoDeleteClientObjects:this.autoDeleteClientObjects,
        }]);
        this.pingLoop();
    }

    protected abstract _connectAsync():Promise<void>;

    protected onDisconnected()
    {
        this.tryReconnectAsync();
    }

    private async tryReconnectAsync()
    {
        if(this.disabledAutoReconnect){
            this.dispose();
            return;
        }
        if(this._connectionState.value==='reconnecting'){
            return;
        }
        this._connectionState.next('reconnecting');
        await delayAsync(1000);
        if(this.isDisposed){
            return;
        }
        let connected=false;
        let end=false;
        await Promise.race([
            (async ()=>{
                while(!end){
                    try{
                        await this._connectAsync();
                        connected=true;
                        break;
                    }catch(ex){
                        console.warn('ObjSyncClient reconnect failed',ex);
                        await delayAsync(500);
                    }
                }
            })(),
            delayAsync(this.reconnectTimeoutMs),
        ])
        end=true;
        if(this.isDisposed){
            return;
        }
        if(!connected){
            this.dispose();
            return;
        }
        this._connectionState.next('connected');
        this.lastPing=0;
        this.lastPong=0;
        this.finishReconnectOnNextSet=true;
        this.send([{type:'createClient'},{
            type:'get',
        }]);
    }

    private finishReconnectOnNextSet=false;

    private lastPing=0;
    private lastPong=0;
    protected pingLoop()
    {
        if(this.pingIntervalMs===undefined || this.isHost){
            return;
        }
        this.lastPing=0;
        this.lastPong=0;
        const iv=setInterval(()=>{
            if(this.isDisposed){
                clearInterval(iv);
                return;
            }

            if(this._connectionState.value==='reconnecting'){
                this.lastPing=0;
                this.lastPong=0;
                return;
            }

            if(this.lastPong && this.lastPing && this.lastPing>this.lastPong){
                console.warn('ObjSyncClient ping lost');
                this.lastPing=0;
                this.lastPong=0;
                this._pingLost();
                this.tryReconnectAsync();
            }

            this.lastPing=Date.now();
            this.send({type:'ping',pc:true});
        },this.pingIntervalMs)
    }

    protected handleError(error:any){

        console.error('ObjSyncClient error',error);
        this.dispose();
    }

    protected handleCommand(
        command:(ObjSyncClientCommand|ObjSyncRemoteCommand)|(ObjSyncClientCommand|ObjSyncRemoteCommand)[],
        handled=false
    ){
        if( (this.logCommands&logAllOrCommands) &&
            ((this.logCommands&ObjSyncClientLogLevel.ping) || !areAllPings(command))
        ){
            console.info('<< obj-sync RCV',...asArray(command));
        }
        if(this._isDisposed){
            return;
        }

        let remoteCommands:ObjSyncRemoteCommand[]|null=null;

        if(Array.isArray(command)){
            let handleCount=0;
            for(const cmd of command){
                if(!isObjSyncClientCommand(cmd)){
                    if(!remoteCommands){
                        remoteCommands=[];
                    }
                    remoteCommands.push(cmd);
                    continue;
                }
                const parseResult=ObjSyncClientCommandScheme.safeParse(cmd);
                if(parseResult.success===false){
                    this.handleError(parseResult.error);
                    return;
                }
                if(cmd.clientId===this.clientId || cmd.clientId===objSyncBroadcastClientId){
                    handleCount++;
                }
            }
            if(handleCount){
                this.watcher.requestQueueChanges();
                try{
                    for(const cmd of command){
                        if( isObjSyncClientCommand(cmd) &&
                            (cmd.clientId===this.clientId || cmd.clientId===objSyncBroadcastClientId)
                        ){
                            this._handleCommand(cmd);
                        }
                    }
                }finally{
                    this.watcher.requestDequeueChanges();
                }
                return;
            }
        }else{
            if(isObjSyncClientCommand(command)){
                const parseResult=ObjSyncClientCommandScheme.safeParse(command);
                if(parseResult.success===false){
                    this.handleError(parseResult.error);
                    return;
                }
                if(command.clientId===this.clientId || command.clientId===objSyncBroadcastClientId){
                    this.watcher.requestQueueChanges();
                    try{
                        this._handleCommand(command);
                    }finally{
                        this.watcher.requestDequeueChanges();
                    }
                }
            }else{
                remoteCommands=[command];
            }
        }
        if(remoteCommands){
            this.handleRemoteCommands(remoteCommands,handled);
        }
    }

    private readonly hostState:ObjSyncObjState;
    private handleRemoteCommands(commands:|ObjSyncRemoteCommand[],handled=false)
    {
        if(!this.isHost){
            this.handleError('Remote command received by non-host client');
            return;
        }
        for(const cmd of commands){
            const parseResult=ObjSyncRemoteCommandScheme.safeParse(cmd);
            if(parseResult.success===false){
                console.error('Invalid remote command',cmd);
                continue;
            }

            switch(cmd.type){

                case 'createClient':
                    //ignore
                    break;

                case 'get':{
                    const clientCmd:ObjSyncClientCommand={
                        type:'set',
                        clientId:cmd.clientId,
                        objId:this.hostState.objId,
                        changeIndex:this.hostState.changeIndex,
                        state:this.hostState,
                    }
                    this.sendClientCommands([clientCmd],handled);
                    break;
                }

                case 'evt':{
                    if(!cmd.evts){
                        console.error('Evt command must define the evt prop');
                        break;
                    }

                    this.hostState.changeIndex++;

                    const clientCmd:ObjSyncClientCommand={
                        type:'evt',
                        clientId:objSyncBroadcastClientId,
                        objId:this.hostState.objId,
                        changeIndex:this.hostState.changeIndex,
                        evts:cmd.evts as any
                    }
                    this.sendClientCommands([clientCmd],handled);
                    break;
                }

                case 'ping':{
                    const clientCmd:ObjSyncClientCommand={
                        type:'pong',
                        clientId:cmd.clientId,
                        objId:cmd.objId,
                        changeIndex:0,
                    }
                    this.sendClientCommands([clientCmd],handled);
                    break;
                }
            }
        }
    }

    private broadcastState()
    {
        if(!this.isHost){
            return;
        }
        const clientCmd:ObjSyncClientCommand={
            type:'set',
            clientId:objSyncBroadcastClientId,
            objId:this.hostState.objId,
            changeIndex:this.hostState.changeIndex,
            state:this.hostState,
        }
        this.sendClientCommands([clientCmd]);
    }


    private cmdQueue:ObjSyncClientCommand[]=[];
    private cmdQueueTTL:number|null=null;

    private queueCmd(command:ObjSyncClientCommand)
    {
        if(this.cmdQueueTTL===null){
            this.cmdQueueTTL=Date.now()+(this.maxCommandQueueSeconds*1000);
        }else if(this.cmdQueueTTL<Date.now()){
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
        this.cmdQueueTTL=null;

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
            this.lastPong=Date.now();
            return;
        }else if(command.type==='reconnect'){
            this.tryReconnectAsync();
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
        const skipApply=(command as any)[this.skipApply]===true;

        switch(command.type){

            case 'evt':
                if(command.evts){
                    if(!skipApply){
                        for(const evt of command.evts){
                            this.mirror.handleEvent(evt,this.objEvtSource);
                        }
                    }
                }else{
                    this.handleError('command.evts missing');
                    break;
                }
                break;

            case 'delete':
                if(!skipApply){
                    this.deleteState();
                }
                break;


            case 'set':
                if(command.state){
                    if(command.state.objId!==this.objId){
                        this.handleError('command.state.objId mismatch');
                        return;
                    }
                    this._changeIndex=command.changeIndex;
                    if(!this.isHost && !skipApply){
                        this.setStateWithLogs(command.state.state,command.state.log as RecursiveObjWatchEvt<any>[]);
                    }
                    if(this.finishReconnectOnNextSet){
                        this.finishReconnectOnNextSet=false;
                        this._onReconnected.next();
                    }
                }
                break;

        }

        if(command.type==='set' && !this._isReady.value){
            this._isReady.next(true);
            this.readySource.resolve();
            if(this.isHost){
                this.broadcastState();
            }
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
                if(obj[e]===undefined){
                    this.watcher.deleteProp(e,this.objEvtSource);
                }
            }
            for(const e in obj){
                this.watcher.setOrMergeProp(e,obj[e],this.objEvtSource);
            }
            for(const e of log){
                this.mirror.handleEvent(e,this.objEvtSource);
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
                this.watcher.deleteProp(e,this.objEvtSource);
            }
        }finally{
            this.watcher.requestDequeueChanges();
        }
    }

    private readonly queueKey=Symbol('queueKey');

    private queueObjCmd(obj:any,cmd:ObjSyncRecursiveObjWatchEvt){
        if(!obj){
            return;
        }
        const ary:ObjSyncRecursiveObjWatchEvt[]=obj[this.queueKey]??(obj[this.queueKey]=[]);
        mergeEvents([deepClone(cmd)],ary);
    }

    private dequeueObjCmdQueue(obj:any):ObjSyncRecursiveObjWatchEvt[]|undefined{
        if(!obj){
            return undefined;
        }
        const ary=obj[this.queueKey];
        if(ary){
            delete obj[this.queueKey];
        }
        return ary;
    }

    public simDisconnect()
    {
        this.send({
            type:'simCleanUp'
        })
    }
}

const mergeEvents=(src:ObjSyncRecursiveObjWatchEvt[],dest:ObjSyncRecursiveObjWatchEvt[])=>{

    for(let s=0;s<src.length;s++){
        const evt=src[s];
        if(!evt){
            continue;
        }
        destLoop: for(let d=dest.length-1;d>=0;d--){
            const dEvt=dest[d];
            if( dEvt &&
                evt.type=='set' &&
                dEvt.type==='set' &&
                evt.prop===dEvt.prop &&
                evt.path &&
                dEvt.path &&
                evt.path.length===dEvt.path.length
            ){
                for(let l=0;l<evt.path.length;l++){
                    if(evt.path[l]!==dEvt.path[l]){
                        continue destLoop;
                    }
                }
                dest.splice(d,1);
                break;

            }
        }

        dest.push(evt);
    }
}




const getPingCount=(cmd:(ObjSyncClientCommand|ObjSyncRemoteCommand|ScopedObjSyncRemoteCommand)|(ObjSyncClientCommand|ObjSyncRemoteCommand|ScopedObjSyncRemoteCommand)[]):number=>{
    if(Array.isArray(cmd)){
        let count=0;
        for(let index=0;index<cmd.length;index++){
            const c=cmd[index];
            if(c && (c.type==='pong' || c.type==='ping')){
                count++;
            }
        }
        return count;
    }else{
        return (cmd.type==='pong' || cmd.type==='ping')?1:0;
    }
}

const areAllPings=(cmd:(ObjSyncClientCommand|ObjSyncRemoteCommand|ScopedObjSyncRemoteCommand)|(ObjSyncClientCommand|ObjSyncRemoteCommand|ScopedObjSyncRemoteCommand)[]):boolean=>{
    const count=getPingCount(cmd);
    return Array.isArray(cmd)?count===cmd.length:count===1;
}
