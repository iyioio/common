import { useCallback, useEffect, useState } from "react";

/**
 * Listens for dropped files over a specified target.
 * @param active If set to false this drag listeners are disabled
 * @param target If true the window object is used, if false drag listeners are disabled,
 *               otherwise the target element or window is used for listening for drag events
 * @returns
 *   0 = array of files dropped.
 *   1 = If true dragging is hovering over the target.
 *   2 = A setter that can be used as the ref of a target element
 *   3 = A function to clear file list
 */
export const useDragDropFiles=(active=true,target?:HTMLElement|Window|null|'window'):[File[]|null,boolean,(elem:HTMLElement|null)=>void,()=>void]=>{

    const [files,setFiles]=useState<File[]|null>(null);
    const [hover,setHover]=useState(false);
    const [elem,setElem]=useState<HTMLElement|null>(null);

    const clearFiles=useCallback(()=>{
        setFiles(null);
    },[])

    if(elem){
        target=elem;
    }

    useEffect(()=>{
        const _target=!active?null:target==='window'?globalThis.window:target;
        if(!_target){
            return;
        }
        const onEnter=(e:Partial<DragEvent>)=>{
            e.preventDefault?.();
            setHover(true);
        }
        const onExit=(e:Partial<DragEvent>)=>{
            e.preventDefault?.();
            setHover(false);
        }
        const onDrop=(e:Partial<DragEvent>)=>{
            setHover(false);
            if(!e.dataTransfer?.files.length){
                return;
            }
            e.preventDefault?.();
            const fileList=e.dataTransfer?.files;
            const files:File[]=[];
            if(fileList){
                for(let i=0;i<fileList.length;i++){
                    files.push(fileList[i])
                }
            }
            setFiles(files);
        }
        _target.addEventListener('drop',onDrop,false);
        _target.addEventListener('dragenter',onEnter,false);
        _target.addEventListener('dragover',onEnter,false);
        _target.addEventListener('dragstart',onEnter,false);
        _target.addEventListener('dragend',onExit,false);
        _target.addEventListener('dragleave',onExit,false);
        return ()=>{
            _target.removeEventListener('drop',onDrop,false);
            _target.removeEventListener('dragenter',onEnter,false);
            _target.removeEventListener('dragover',onEnter,false);
            _target.removeEventListener('dragstart',onEnter,false);
            _target.removeEventListener('dragend',onExit,false);
            _target.removeEventListener('dragleave',onExit,false);
        }
    },[active,target]);

    return [files,hover,setElem,clearFiles];
}
