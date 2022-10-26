import { CancelToken } from "./CancelToken";

export class Lock
{

    private _count=0;
    private _queue:(()=>void)[]=[];

    private _maxConcurrent:number;

    constructor(maxConcurrent:number=1)
    {
        this._maxConcurrent=maxConcurrent;
    }

    public waitAsync(cancel?:CancelToken):Promise<()=>void>
    {
        let released=false;
        const release=()=>{
            if(released){
                return;
            }
            released=true;
            this.release();
        }
        if(this._count<this._maxConcurrent){
            this._count++;
            return new Promise(r=>r(release));
        }else{
            return new Promise((r,j)=>{
                const unsub=cancel?.subscribeOrNextTick(()=>j('canceled'));
                this._queue.push(()=>{
                    unsub?.();
                    this._count++;
                    r(release);
                });
            })
        }
    }

    private release()
    {
        this._count--;
        if(this._count<0){
            throw new Error('Lock out of sync. release has be called too many times.')
        }
        if(this._count<this._maxConcurrent && this._queue.length){
            const next=this._queue[0];
            this._queue.shift();
            next();
        }
    }
}
