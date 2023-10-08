import { atDotCss } from "@iyio/at-dot-css";
import { Form } from "@iyio/react-common";
import { useEffect, useRef, useState } from "react";
import { ProtogenCtrl } from "../lib/ProtogenCtrl";

export interface CommandInputProps
{
    ctrl:ProtogenCtrl;
}

export function CommandInput({
    ctrl
}:CommandInputProps){

    const [cmd,setCmd]=useState('');
    const refs=useRef({historyIndex:-1});

    const submit=()=>{
        if(!cmd.trim()){
            return;
        }
        setCmd('');
        refs.current.historyIndex=-1;
        ctrl.cli.runCmdAsync(cmd);
    }

    const [input,setInput]=useState<HTMLInputElement|null>(null);


    useEffect(()=>{
        if(!input){
            return;
        }
        const sub=ctrl.keyListener.focusCmdRequested.subscribe(()=>{
            input.focus();
        })
        return ()=>{
            sub.unsubscribe();
        }
    },[ctrl,input]);



    return (
        <Form row flex1 alignCenter g050 onSubmit={submit} className={style.root()}>
            &gt;
            <input
                ref={setInput}
                type="text"
                placeholder="enter command"
                className={style.input()}
                value={cmd}
                onChange={e=>setCmd(e.target.value)}
                onKeyDown={e=>{

                    const history=ctrl.cli.cmdHistory;

                    switch(e.key){
                        case 'ArrowUp':
                            if(refs.current.historyIndex===-1){
                                refs.current.historyIndex=history.length-1;
                            }else if(refs.current.historyIndex>0){
                                refs.current.historyIndex--;
                            }
                            setCmd(history[refs.current.historyIndex]??'');
                            e.preventDefault();
                            break;

                        case 'ArrowDown':
                            if(refs.current.historyIndex<history.length && refs.current.historyIndex!==-1){
                                refs.current.historyIndex++;
                                setCmd(history[refs.current.historyIndex]??'');
                            }
                            e.preventDefault();
                            break;
                    }
                }}
            />
        </Form>
    )

}

const style=atDotCss({name:'CommandInput',css:`
    @.root{
        color:#ffffff66;

    }
    @.input{
        all:unset;
        flex:1;
        font-size:12px;
        color:#ffffff;
    }
    @.input::placeholder{
        color:#ffffff33;
    }
`});
