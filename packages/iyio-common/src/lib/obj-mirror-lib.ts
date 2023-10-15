
const pauseObjMirroringCountKey=Symbol('pauseObjMirroringCountKey');

/**
 * Pauses mirroring update for the given object
 */
export const pauseObjMirroring=(obj:any)=>{
    if(!obj){
        return;
    }
    if(obj[pauseObjMirroringCountKey]){
        obj[pauseObjMirroringCountKey]++;
    }else{
        obj[pauseObjMirroringCountKey]=1;
    }
}

export const delayObjMirroring=(obj:any,delayMs:number)=>{
    if(!obj){
        return;
    }
    pauseObjMirroring(obj);
    setTimeout(()=>{
        resumeObjMirroring(obj);
    },delayMs);
}

export const flushObjMirroringCallbacks=(obj:any)=>{
    flushCallbacks(obj);
}

/**
 * Returns true if mirroring is resumed
 */
export const resumeObjMirroring=(obj:any):boolean=>{
    if(!obj){
        return false;
    }
    let count:number|undefined=obj[pauseObjMirroringCountKey];
    if(!count){
        console.error('obj mirroring out of sync',obj);
        throw new Error('obj mirroring out of sync');
    }
    count--;
    if(count){
        obj[pauseObjMirroringCountKey]=count;
        return false;
    }else{
        delete obj[pauseObjMirroringCountKey];
        flushCallbacks(obj);
        return true;
    }
}

export const isObjMirroringPaused=(obj:any):boolean=>{
    return (obj && obj[pauseObjMirroringCountKey])?true:false;
}

export const isObjPathMirroringPaused=(obj:any,path:(string|number|null)[]):boolean=>{
    if(!obj){
        return false;
    }
    if(obj[pauseObjMirroringCountKey]){
        return true;
    }

    for(let i=0;i<path.length;i++){
        const p=path[i];
        if(p===undefined || p===null){
            continue;
        }
        obj=obj[p];
        if(!obj){
            return false;
        }
        if(obj[pauseObjMirroringCountKey]){
            return true;
        }
    }
    return false;
}

const resumeKey=Symbol('resumeKey');

/**
 * Adds a callback to the obj that will be called when the obj resumes mirroring. If the
 * callback has already been added or obj mirroring is not paused false is returned and the
 * callback is not added.
 */
export const addObjMirroringPauseCallback=(obj:any,callback:(obj:any)=>void):boolean=>{
    if(!obj || !isObjMirroringPaused(obj)){
        return false;
    }

    const queue:((obj:any)=>void)[]=obj[resumeKey]??(obj[resumeKey]=[]);
    if(queue.includes(callback)){
        return false;
    }

    queue.push(callback);
    return true;
}

const flushCallbacks=(obj:any)=>{
    const queue:((obj:any)=>void)[]=obj?.[resumeKey];
    if(!queue){
        return;
    }
    for(const c of queue){
        c(obj);
    }
}
