import { atDotCss } from "@iyio/at-dot-css";
import { Text, View } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { AnyCompContainer } from "./AnyCompContainer";
import { AnyCompTreeSelector } from "./AnyCompTreeSelector";
import { AcCompRegistry } from "./any-comp-types";


export interface AnyCompBrowserProps
{
    compId?:string;
    onCompIdChange?:(id:string)=>void;
    reg:AcCompRegistry;
    placeholder?:any;
    treeClassName?:string;
}

export function AnyCompBrowser({
    compId:_compId,
    onCompIdChange,
    reg,
    placeholder,
}:AnyCompBrowserProps){

    const [compId,setCompId]=useState(_compId);

    const comp=reg.comps.find(c=>c.id===compId);

    useEffect(()=>{
        if(_compId){
            setCompId(_compId);
        }
    },[_compId]);

    return (
        <div className={style.root()}>

            <View row flex1>

                <AnyCompTreeSelector
                    className={style.tree()}
                    reg={reg}
                    compId={compId}
                    onCompIdChange={onCompIdChange??setCompId}
                />

                <View flex1 col g1>
                    <select className={style.select()} onChange={e=>{
                        if(onCompIdChange){
                            onCompIdChange(e.target.value);
                        }else{
                            setCompId(e.target.value);
                        }
                    }}>
                        <option value="" selected={!comp}>(none)</option>
                        {reg.comps.map(c=>(
                            <option key={c.id} value={c.id} selected={comp?.id===c.id}>{c.name} - {c.path}</option>
                        ))}
                    </select>

                    <Text h2 text={comp?.name??'No component selected'} />
                    <AnyCompContainer comp={comp} placeholder={placeholder} />
                </View>

            </View>

        </div>
    )

}

const style=atDotCss({name:'AnyCompBrowser',css:`
    @.root{
        display:flex;
        flex-direction:column;
        flex:1;
    }
    @.select{
        all:unset;
        border:1px solid #ffff;
        padding:0.5rem;
        border-radius:8px;
        cursor:pointer;
        align-self:stretch;
        overflow:hidden;
        width:100%;
        box-sizing:border-box;
    }
    @desktopSmUp{
        @.select{
            display:none;
        }
    }
    @tabletDown{
        @.tree{
            display:none;
        }
    }
`});
