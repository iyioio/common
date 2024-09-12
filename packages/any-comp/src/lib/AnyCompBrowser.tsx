import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps, deleteUndefined } from "@iyio/common";
import { Text, View } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { AnyCompComment } from "./AnyCompComment";
import { AnyCompContainer } from "./AnyCompContainer";
import { AnyCompTreeSelector } from "./AnyCompTreeSelector";
import { AcStyleVars, acStyle, defaultAcStyle } from "./any-comp-style";
import { AcCompRegistry, AcTaggedPropRenderer } from "./any-comp-types";


export interface AnyCompBrowserProps
{
    compId?:string;
    onCompIdChange?:(id:string)=>void;
    reg:AcCompRegistry;
    placeholder?:any;
    treeClassName?:string;
    rememberCompId?:boolean;
    renderers?:AcTaggedPropRenderer[];
    styleVars?:Partial<AcStyleVars>;
}

export function AnyCompBrowser({
    compId:_compId,
    onCompIdChange,
    reg,
    placeholder,
    rememberCompId,
    renderers,
    styleVars,
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

    const [canvasSize,setCanvasSize]=useState<'min'|'split'|'max'>('split');

    return (
        <div
            className={style.root(null,null,props)}
            style={acStyle.vars(styleVars?{...defaultAcStyle,...deleteUndefined(styleVars)}:defaultAcStyle)}
        >

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

                    {canvasSize!=='max' && <>
                        <Text lg weightBold text={comp?.name??'No component selected'} />
                        <AnyCompComment comment={comp?.comment} />
                    </>}
                    <AnyCompContainer
                        key={comp?.id??''}
                        comp={comp}
                        placeholder={placeholder}
                        canvasSize={canvasSize}
                        onCanvasSizeChange={setCanvasSize}
                        renderers={renderers}
                    />
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
    }
    @.select{
        all:unset;
        border:1px solid ${acStyle.var('borderColor')};
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
        margin-left:1rem;
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
