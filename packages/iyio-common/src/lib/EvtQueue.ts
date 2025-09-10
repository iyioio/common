import { Subject } from "rxjs";
import { Evt } from "./Evt.js";
import { aryRemoveItem } from "./array.js";
import { DisposeCallback } from "./common-types.js";
import { EvtQueueListener } from "./evt-queue-lib.js";

export class EvtQueue
{

    private readonly subjects:Record<string,Subject<Evt[]>>={};
    private readonly listeners:Record<string,EvtQueueListener[]>={};
    private readonly catchAllListeners:EvtQueueListener[]=[];


    public getTopicSubject(topic:string):Subject<Evt[]>{
        let sub=this.subjects[topic];
        if(!sub){
            sub=new Subject<Evt[]>();
            this.subjects[topic]=sub;
            this.addListener(topic,(topic,evts)=>(sub as Subject<Evt[]>).next(evts));
        }
        return sub;
    }

    public addListener(topic:string,listener:EvtQueueListener):DisposeCallback{
        const listeners=this.listeners[topic]??(this.listeners[topic]=[]);
        listeners.push(listener);
        return ()=>{
            aryRemoveItem(listeners,listener);
        }
    }

    public addCatchAllListeners(listener:EvtQueueListener):DisposeCallback{
        this.catchAllListeners.push(listener);
        return ()=>{
            aryRemoveItem(this.catchAllListeners,listener);
        }
    }

    public _addListener(topic:string,listener:EvtQueueListener):DisposeCallback{
        const sub=this.getTopicSubject(topic).subscribe(evts=>{
            try{
                listener(topic,evts);
            }catch(ex){
                console.error(`EvtQueueListener callback error. topic: ${topic}`,ex);
            }
        });
        return ()=>{
            sub.unsubscribe();
        }
    }

    private readonly completedPromise=Promise.resolve();

    /**
     * Queues a message or list of messages and waits for any listeners completes
     * @note This function is optimized to return a Promise without being a true async function for performance reasons
     */
    public queueAsync(topic:string,evt:Evt|Evt[]):Promise<void>
    {
        const listeners=this.listeners[topic];
        if(!listeners && !this.catchAllListeners.length){
            return this.completedPromise;
        }

        if(!Array.isArray(evt)){
            evt=[evt];
        }

        let promises:Promise<void>[]|undefined;

        for(let i=0;i<this.catchAllListeners.length;i++){
            const listener=this.catchAllListeners[i] as EvtQueueListener;
            try{
                let p=listener(topic,evt);
                if(!p){
                    continue;
                }
                p=p.catch(ex=>console.error(`EvtQueueListener catchAll callback error. topic: ${topic}`,ex));
                if(!promises){
                    promises=[];
                }
                promises.push(p);
            }catch(ex){
                console.error(`EvtQueueListener catchAll callback error. topic: ${topic}`,ex);
            }
        }

        if(listeners){
            for(let i=0;i<listeners.length;i++){
                const listener=listeners[i] as EvtQueueListener;
                try{
                    let p=listener(topic,evt);
                    if(!p){
                        continue;
                    }
                    p=p.catch(ex=>console.error(`EvtQueueListener callback error. topic: ${topic}`,ex));
                    if(!promises){
                        promises=[];
                    }
                    promises.push(p);
                }catch(ex){
                    console.error(`EvtQueueListener callback error. topic: ${topic}`,ex);
                }
            }
        }

        if(!promises){
            return this.completedPromise
        }else if(promises.length>1){
            return Promise.all(promises).then();
        }else{
            return promises[0] as Promise<void>;
        }
    }

    /**
     * Queues a message or list of messages without waiting for listeners to complete
     */
    public queue(evt:Evt|Evt[]):void;
    public queue(topic:string,evt:Evt|Evt[]):void;
    public queue(topicOrEvt:string|Evt|Evt[],evt?:Evt|Evt[]):void{
        if(typeof topicOrEvt === 'string'){
            if(evt){
                this.queueAsync(topicOrEvt,evt);
            }
        }else{
            if(Array.isArray(topicOrEvt)){
                const first=topicOrEvt[0];
                if(first){
                    this.queueAsync(first.type,topicOrEvt);
                }
            }else{
                this.queueAsync(topicOrEvt.type,topicOrEvt);
            }
        }
    }
}
