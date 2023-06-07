import { SlimButton } from "@iyio/react-common";
import { useEffect, useState } from "react";


export default function Index()
{

    const [configs,setConfigs]=useState<string[]>([]);

    useEffect(()=>{
        let m=true;
        (async ()=>{
            try{
                const list=await (await fetch('/api/protogen/configs')).json();
                if(m){
                    setConfigs(list);
                }
            }catch(ex){
                console.error('Unable to load config list',ex);
            }
        })()
        return ()=>{m=false};
    },[]);

    return (
        <div className="Index">

            <ul>
                {configs.map(c=>(
                    <SlimButton m050 key={c} elem="li" to={'/'+c}>{c}</SlimButton>
                ))}
            </ul>

            <style jsx>{`
                .Index{
                    display:flex;
                    flex-direction:column;
                    flex:1;
                    justify-content:center;
                    align-items:center;
                }
            `}</style>
        </div>
    )

}
