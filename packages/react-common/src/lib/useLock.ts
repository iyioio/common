import { DisposeCallback, IProgress, Scope, UiLock, UiLockHandle, getNextUiLockId, rootScope, uiLockContainerService } from "@iyio/common";
import { useEffect, useMemo } from "react";

export function useLock(scope:Scope=rootScope):UiLockHandle
{

    const container=uiLockContainerService(scope);

    const ctx=useMemo(()=>{

        let m=true;
        const locks:UiLock[]=[];
        const disposeList:((()=>void)|null)[]=[];
        const add=(message:string,progress:IProgress|null|undefined)=>{
            if(!m){
                return ()=>{/* */}
            }

            const eventListener=(e:Event)=>{
                try{
                    (globalThis.window?.document?.activeElement as any)?.blur?.();
                    e.preventDefault();
                    e.stopPropagation();
                }catch{/* */}
            }
            (globalThis.window?.document?.activeElement as any)?.blur?.();

            let disposeListeners:DisposeCallback|null=null;

            if(globalThis.window){
                globalThis.window.addEventListener('keydown',eventListener);
                globalThis.window.addEventListener('keyup',eventListener);
                globalThis.window.addEventListener('keypress',eventListener);
                globalThis.window.document.body.addEventListener('mousedown',eventListener);
                globalThis.window.document.body.addEventListener('mousemove',eventListener);
                globalThis.window.document.body.addEventListener('mouseup',eventListener);
                globalThis.window.document.body.addEventListener('touchstart',eventListener);
                globalThis.window.document.body.addEventListener('touchmove',eventListener);
                globalThis.window.document.body.addEventListener('touchend',eventListener);
                disposeListeners=()=>{
                    globalThis.window.removeEventListener('keydown',eventListener);
                    globalThis.window.removeEventListener('keyup',eventListener);
                    globalThis.window.removeEventListener('keypress',eventListener);
                    globalThis.window.document.body.removeEventListener('mousedown',eventListener);
                    globalThis.window.document.body.removeEventListener('mousemove',eventListener);
                    globalThis.window.document.body.removeEventListener('mouseup',eventListener);
                    globalThis.window.document.body.removeEventListener('touchstart',eventListener);
                    globalThis.window.document.body.removeEventListener('touchmove',eventListener);
                    globalThis.window.document.body.removeEventListener('touchend',eventListener);
                }
            }

            const id=getNextUiLockId();
            const lock:UiLock={
                id,
                message,
                active:true,
                progress:progress||null,
            }

            locks.push(lock);
            container.locksSubject.next([...container.locksSubject.value,lock]);
            const di=disposeList.length;
            const dispose=()=>{
                if(!disposeList[di]){
                    return;
                }
                disposeList[di]=null;
                disposeListeners?.();
                setTimeout(()=>{
                    container.locksSubject.next([
                        ...container.locksSubject.value.filter(l=>l.id!==id),
                        {...lock,active:false}
                    ])
                    setTimeout(()=>{
                        container.locksSubject.next(container.locksSubject.value.filter(l=>l.id!==id));
                    },2000);
                },300);
            }
            disposeList.push(dispose);
            return dispose;
        }
        const dispose=()=>{
            m=false;
            for(const d of disposeList){
                d?.();
            }
        }

        const get=async <T>(message:string,progress:IProgress|null|undefined,asyncWork:()=>Promise<T>)=>{
            const d=add(message,progress);
            try{

                const result=await asyncWork();
                return {
                    result,
                    success:true,
                    error:null
                }

            }catch(ex){
                console.error('LockHandle error - '+message,ex)
                return {
                    result:null,
                    success:false,
                    error:ex
                }
            }finally{
                d();
            }
        }

        const handle:UiLockHandle={
            lock:add,
            get:(message,asyncWork)=>get(message,undefined,asyncWork),
            getWithProgress:get,
            runWithProgress:<T>(message:string,progress:IProgress|null|undefined,asyncWork:()=>Promise<T>)=>{
                get(message,progress,asyncWork)
            },
            run:<T>(message:string,asyncWork:()=>Promise<T>)=>{
                get(message,undefined,asyncWork)
            },
        }

        return {
            handle,
            dispose
        }

    },[container]);

    useEffect(()=>{
        return ctx.dispose;
    },[ctx]);

    return ctx.handle;
}
