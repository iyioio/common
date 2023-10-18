import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps } from "@iyio/common";
import { Text, View } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { AnyCompComment } from "./AnyCompComment";
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
    foregroundColor?:string;
    rememberCompId?:boolean;
}

export function AnyCompBrowser({
    compId:_compId,
    onCompIdChange,
    reg,
    placeholder,
    foregroundColor='#000000',
    rememberCompId,
    ...props
}:AnyCompBrowserProps & BaseLayoutOuterProps){

    const [compId,setCompId]=useState(_compId);

    const comp=reg.comps.find(c=>c.id===compId);

    useEffect(()=>{
        if(_compId){
            setCompId(_compId);
        }
    },[_compId]);

    useEffect(()=>{
        if(rememberCompId && compId){
            globalThis.localStorage?.setItem('AnyCompBrowser.compId',compId);
        }
    },[rememberCompId,compId]);

    useEffect(()=>{
        if(rememberCompId){
            const id=globalThis.localStorage?.getItem('AnyCompBrowser.compId');
            if(id){
                setCompId(id);
            }
        }
    },[rememberCompId]);

    return (
        <div className={style.root(null,null,props)} style={style.vars({
            foregroundColor,
            inputBg:foregroundColor+'33',
            borderColor:foregroundColor+'33',
        })}>

            <View row flex1>

                <AnyCompTreeSelector
                    className={style.tree()}
                    reg={reg}
                    compId={compId}
                    onCompIdChange={onCompIdChange??setCompId}
                />

                <View flex1 col className={style.rightCol()}>
                    <select className={style.select()} defaultValue={compId} onChange={e=>{
                        if(onCompIdChange){
                            onCompIdChange(e.target.value);
                        }else{
                            setCompId(e.target.value);
                        }
                    }}>
                        <option value="">(none)</option>
                        {reg.comps.map(c=>(
                            <option key={c.id} value={c.id}>{c.name} - {c.path}</option>
                        ))}
                    </select>

                    <Text lg weightBold text={comp?.name??'No component selected'} />
                    <AnyCompComment comment={comp?.comment} />
                    <AnyCompContainer key={comp?.id??''} comp={comp} placeholder={placeholder} foregroundColor={foregroundColor} />
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
        color:@@foregroundColor;
        --any-comp-foreground-color:@@foregroundColor;
        --any-comp-input-bg:@@inputBg;
        --any-comp-border-color:@@borderColor;
    }
    @.select{
        all:unset;
        border:1px solid var(--any-comp-border-color);
        padding:0.5rem;
        border-radius:8px;
        cursor:pointer;
        align-self:stretch;
        overflow:hidden;
        width:100%;
        box-sizing:border-box;
    }
    @.rightCol{
        padding-top:1rem;
        gap:0.25rem;
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
