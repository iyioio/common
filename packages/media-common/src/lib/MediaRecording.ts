import { PromiseSource, ReadonlySubject, asArray, createPromiseSource, delayAsync } from "@iyio/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { MediaRecordingResult } from "./media-types.js";

export const defaultMediaRecordingAudioKBPerSecond=2;
export const defaultMediaRecordingVideoKBPerSecond=50;

export interface MediaRecordingOptions
{
    recorderOptions?:MediaRecorderOptions;
    stream?:MediaStream;
    streams?:MediaStream[];
    recorder?:MediaRecorder;
    /**
     * The first media constraint that yeilds a stream will be used
     */
    mediaConstraints?:(MediaStreamConstraints|null|undefined)|(MediaStreamConstraints|null|undefined)[];

    /**
     * @default 2
     */
    audioKBPerSecond?:number;

    /**
     * @default 50
     */
    videoKBPerSecond?:number;

    /**
     * If ture all recored data blobs will be stored in the data property and returned.
     */
    storeAllData?:boolean;

    /**
     * If defined the recoding will be split into spearte blobs.
     */
    timesliceMs?:number;

    mimeType?:string;


}

export class MediaRecording
{

    private readonly options:MediaRecordingOptions;

    private readonly _recorder:BehaviorSubject<MediaRecorder|null>=new BehaviorSubject<MediaRecorder|null>(null);
    public get recorderSubject():ReadonlySubject<MediaRecorder|null>{return this._recorder}
    public get recorder(){return this._recorder.value}

    private readonly _data:BehaviorSubject<Blob[]>=new BehaviorSubject<Blob[]>([]);
    public get dataSubject():ReadonlySubject<Blob[]>{return this._data}
    public get data(){return this._data.value}

    private readonly _recording:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get recordingSubject():ReadonlySubject<boolean>{return this._recording}
    public get recording(){return this._recording.value}

    private readonly _onData=new Subject<Blob>();
    public get onData():Observable<Blob>{return this._onData}


    public constructor(options:MediaRecordingOptions)
    {
        this.options={...options};
    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public get isStopped(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        try{
            this._recorder.value?.stop();
        }catch{
            //
        }
        this.endSource?.resolve();
    }

    private isPaused=false;

    public start()
    {
        this.recordAsync();
    }

    private recordPromise:Promise<MediaRecordingResult|null>|null=null;
    public async recordAsync():Promise<MediaRecordingResult|null>
    {
        if(!this.recordPromise){
            this.recordPromise=this._recordAsync();
        }
        return await this.recordPromise;
    }

    private endSource:PromiseSource<void>|null=null;

    private async _recordAsync():Promise<MediaRecordingResult|null>
    {
        if(this._isDisposed){
            return null;
        }

        const getOptions=()=>{
            const mo:MediaRecorderOptions={
                audioBitsPerSecond:(this.options.audioKBPerSecond??defaultMediaRecordingAudioKBPerSecond)*8000,
                videoBitsPerSecond:(this.options.videoKBPerSecond??defaultMediaRecordingVideoKBPerSecond)*8000,
                mimeType:this.options.mimeType,
                ...this.options.recorderOptions,
            }
            return mo;
        }

        let recorder=this.options.recorder;
        if(!recorder && this.options.streams){
            const stream=new MediaStream();
            const streams=this.options.stream?
                [this.options.stream,...this.options.streams]:
                this.options.streams;
            for(const s of streams){
                const tracks=s.getTracks();
                for(const t of tracks){
                    stream.addTrack(t);
                }
            }
            recorder=new MediaRecorder(stream,getOptions());
        }
        if(!recorder && this.options.stream){
            recorder=new MediaRecorder(this.options.stream,getOptions());
        }

        let disposeStream:MediaStream|null=null;

        if(!recorder && this.options.mediaConstraints){
            const ary=asArray(this.options.mediaConstraints)??[];
            for(const mc of ary){
                if(!mc){
                    continue;
                }
                try{
                    const stream=await navigator.mediaDevices.getUserMedia(mc);
                    if(!stream){
                        continue;
                    }
                    disposeStream=stream;
                    recorder=new MediaRecorder(stream,getOptions());
                    break;
                }catch{
                    //
                }
            }
        }

        if(!recorder){
            throw new Error('Unable to stream for recording');
        }

        try{

            const data:Blob[]=[];

            if(this._isDisposed){
                return {
                    recorder,
                    data,
                    mimeType:'',
                };
            }

            const endSource=createPromiseSource<void>();

            recorder.addEventListener('dataavailable',e=>{
                if(!this.options.storeAllData){
                    data.splice(0,data.length);
                }
                data.push(e.data);
                this._data.next([...data]);
                this._onData.next(e.data);
            })
            recorder.addEventListener('pause',()=>this.isPaused=true);
            recorder.addEventListener('resume',()=>this.isPaused=false);
            recorder.addEventListener('stop',()=>{this._recording.next(false);endSource.resolve()});
            recorder.addEventListener('start',()=>this._recording.next(true));
            recorder.addEventListener('error',e=>endSource.reject(e));

            if(this.options.timesliceMs){
                recorder.start(this.options.timesliceMs);
            }else{
                recorder.start();
            }
            if(this.isPaused){
                recorder.pause();
            }
            this.endSource=endSource;
            this._recorder.next(recorder);

            await endSource.promise;

            const start=Date.now();
            while(!data.length && Date.now()-start<2000){
                await delayAsync(1);
            }

            return {
                recorder,
                data,
                mimeType:recorder.mimeType,
            }
        }finally{
            if(disposeStream){
                try{
                    disposeStream.getTracks().forEach(t=>{
                        t.stop();
                    })
                }catch{
                    //
                }
            }
            try{
                this._recorder.value?.stop();
            }catch{
                //
            }
        }
    }

    public stop()
    {
        this.dispose();
    }

    public pause()
    {
        if(this.isPaused){
            return;
        }
        this.isPaused=true;
        this._recorder.value?.pause();

    }

    public resume()
    {
        if(!this.isPaused){
            return;
        }
        this.isPaused=false;
        this._recorder.value?.resume();
    }
}
