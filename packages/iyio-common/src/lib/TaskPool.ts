
let processing=false;
type Task=()=>Promise<any>;
const poolQueue:(()=>void)[]=[];
export class TaskPool
{
    private readonly tasks:Task[]=[];

    private maxConcurrent:number;

    constructor(maxConcurrent:number=10)
    {
        if(!isFinite(maxConcurrent) || maxConcurrent<1){
            maxConcurrent=1;
        }
        this.maxConcurrent=maxConcurrent;
    }

    public addTask(task:Task)
    {
        if(this.waitPromise){
            throw new Error('Can no longer add tasks to a pool that is being waited on')
        }
        this.tasks.push(task);
    }

    public addTasks(tasks:(Task|null|undefined|false|0|'')[])
    {
        if(this.waitPromise){
            throw new Error('Can no longer add tasks to a pool that is being waited on')
        }
        for(const t of tasks){
            if(t){
                this.tasks.push(t);
            }
        }
    }

    private waitPromise:Promise<void>|null=null;

    public waitAsync():Promise<void>
    {
        if(!this.waitPromise){
            this.waitPromise=this._waitAsync();
        }
        return this.waitPromise;
    }

    private async _waitAsync():Promise<void>
    {

        let err:any=null;

        if(processing){
            await new Promise<void>(r=>{
                poolQueue.push(r);
            })
        }

        processing=true;

        while(this.tasks.length){
            const chunk:Promise<any>[]=[];
            for(let i=0;i<this.maxConcurrent;i++){
                const t=this.tasks.shift();
                if(t){
                    chunk.push(t());
                }else{
                    break;
                }
            }

            try{
                await Promise.all(chunk);
            }catch(ex){
                err=ex;
            }
        }

        processing=false;

        poolQueue.shift()?.();

        if(err){
            throw err;
        }
    }

}