import { atDotCss } from "@iyio/at-dot-css";
import { ErrorBoundary, ScrollView, SlimButton, Text, View } from "@iyio/react-common";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnyComp } from "./AnyComp";
import { AnyCompPropsView } from "./AnyCompPropsView";
import { AcComp, AcProp } from "./any-comp-types";


export interface AnyCompContainerProps
{
    comp?:AcComp;
    placeholder?:any;
    foregroundColor?:string;
    canvasSize?:'min'|'split'|'max';
    onCanvasSizeChange?:(value:'min'|'split'|'max')=>void;
}

export function AnyCompContainer({
    comp,
    placeholder,
    foregroundColor='#000000',
    canvasSize='split',
    onCanvasSizeChange
}:AnyCompContainerProps){

    const [props,setProps]=useState<Record<string,any>>({});
    const [bindings,setBindings]=useState<Record<string,string>>({});

    const [extra,setExtra]=useState('{\n\n}');
    const [extraProps,setExtraProps]=useState<Record<string,any>>({});
    const compProps=useMemo(()=>({...props,...extraProps}),[props,extraProps]);

    const applyExtraProps=()=>{
        try{
            setExtraProps(JSON.parse(extra))
        }catch(ex){
            console.error('Unable to set extra props',ex);
        }
    }

    const requiredProps:AcProp[]=[];
    if(comp){
        for(const p of comp.props){
            if(!p.o && props[p.name]===undefined){
                requiredProps.push(p)
            }
        }
    }

    const [inputKey,setInputKey]=useState(0);

    const save=()=>{
        if(!comp){
            return;
        }
        globalThis.localStorage?.setItem(`any-comp-${comp.id}`,JSON.stringify({props,extra,bindings}));
        setSaved(true);
    }

    const clearSave=()=>{
        if(!comp){
            return;
        }
        globalThis.localStorage?.removeItem(`any-comp-${comp.id}`);
        setSaved(false);
    }

    const reset=()=>{
        setProps({});
        setExtra('{\n\n}');
        setExtraProps({});
        setInputKey(v=>v+1);
        setBindings({});
    }

    const [saved,setSaved]=useState(false);

    const loadSave=useCallback(()=>{
        if(!comp){
            return;
        }
        const json=globalThis.localStorage?.getItem(`any-comp-${comp.id}`);
        if(!json){
            return;
        }
        try{
            const {props,extra,bindings}=JSON.parse(json)
            setInputKey(v=>v+1);
            setProps(props);
            setSaved(true);
            setExtra(extra);
            setBindings(bindings??{})
            try{
                setExtraProps(JSON.parse(extra));
            }catch{
                //
            }
        }catch(error){
            console.error('unable to load comp state',{comp,json,error});
        }
    },[comp]);

    useEffect(()=>{
        loadSave();
    },[loadSave]);

    const [display,setDisplay]=useState<(typeof displays)[number]>('flexColumn');
    const [justify,setJustify]=useState<(typeof justifyTypes)[number]|undefined>(undefined);
    const [align,setAlign]=useState<(typeof alignTypes)[number]|undefined>(undefined);


    return (
        <div className={style.root()} style={style.vars({foregroundColor})}>

            {requiredProps.length?
                requiredProps.map(p=>(
                    <Text weightBold lg key={p.name} text={`${p.name} - required before rendering`}/>
                ))
            :
                <ScrollView
                    fitToMaxSize={canvasSize==='min'?'20vh':canvasSize==='max'?undefined:'60vh'}
                    flex1={canvasSize==='max'}
                    className={style.mainScroll()}
                    containerClassName={style.mainScrollContainer()}
                >
                    <ErrorBoundary key={comp?.id}>
                        <div style={{
                            display:display?'flex':'block',
                            flexDirection:display==='flexColumn'?'column':display==='flexRow'?'row':undefined,
                            justifyContent:justify,
                            alignItems:align
                        }}>
                            <AnyComp
                                key={inputKey}
                                comp={comp}
                                compProps={compProps}
                                placeholder={placeholder}
                            />
                        </div>
                    </ErrorBoundary>
                </ScrollView>
            }
            <View row justifyBetween mb1={canvasSize==='max'}>
                <View row className={style.bottomButtons()}>
                    <View row>
                        (
                        <SlimButton onClick={()=>setDisplay(display==='flexColumn'?'block':'flexColumn')} className={style.btn({active:display==='flexColumn'})}>col</SlimButton>
                        |
                        <SlimButton onClick={()=>setDisplay(display==='flexRow'?'block':'flexRow')} className={style.btn({active:display==='flexRow'})}>row</SlimButton>
                        )
                    </View>
                    <View row>
                        justify (
                        <SlimButton onClick={()=>setJustify(justify==='flex-start'?undefined:'flex-start')} className={style.btn({active:justify==='flex-start'})}>s</SlimButton>
                        |
                        <SlimButton onClick={()=>setJustify(justify==='center'?undefined:'center')} className={style.btn({active:justify==='center'})}>c</SlimButton>
                        |
                        <SlimButton onClick={()=>setJustify(justify==='flex-end'?undefined:'flex-end')} className={style.btn({active:justify==='flex-end'})}>e</SlimButton>
                        )
                    </View>
                    <View row>
                        align (
                        <SlimButton onClick={()=>setAlign(align==='flex-start'?undefined:'flex-start')} className={style.btn({active:align==='flex-start'})}>s</SlimButton>
                        |
                        <SlimButton onClick={()=>setAlign(align==='center'?undefined:'center')} className={style.btn({active:align==='center'})}>c</SlimButton>
                        |
                        <SlimButton onClick={()=>setAlign(align==='flex-end'?undefined:'flex-end')} className={style.btn({active:align==='flex-end'})}>e</SlimButton>
                        )
                    </View>
                    <View row>
                        canvas (
                        <SlimButton onClick={()=>onCanvasSizeChange?.('min')} className={style.btn({active:canvasSize==='min'})}>sm</SlimButton>
                        |
                        <SlimButton onClick={()=>onCanvasSizeChange?.('split')} className={style.btn({active:canvasSize==='split'})}>md</SlimButton>
                        |
                        <SlimButton onClick={()=>onCanvasSizeChange?.('max')} className={style.btn({active:canvasSize==='max'})}>lg</SlimButton>
                        )
                    </View>
                </View>
                <View row className={style.bottomButtons()}>
                    <SlimButton onClick={save}>(Save)</SlimButton>
                    {saved && <>
                        <SlimButton onClick={clearSave}>(Delete)</SlimButton>
                        <SlimButton onClick={loadSave}>(Load)</SlimButton>
                    </>}
                    <SlimButton onClick={reset}>(Reset)</SlimButton>
                </View>
            </View>
            <ScrollView flex1 className={style.scroll({hide:canvasSize==='max'})} containerClassName={style.scrollContainer()}>
                <View col className={style.inputContainer()} key={inputKey}>

                    <Text lg text="Props" />

                    <AnyCompPropsView
                        comp={comp}
                        props={props}
                        setProps={setProps}
                        bindings={bindings}
                        setBindings={setBindings}
                        extra={extra}
                        setExtra={setExtra}
                        applyExtraProps={applyExtraProps}
                    />

                </View>

            </ScrollView>

        </div>
    )

}

const displays=['flexColumn','flexRow','block'] as const;
const justifyTypes=['flex-start','center','flex-end'] as const;
const alignTypes=['flex-start','center','flex-end','stretch'] as const;

const style=atDotCss({name:'AnyCompContainer',css:`
    @.root{
        display:flex;
        flex-direction:column;
        flex:1;
        gap:1rem;
        color:@@foregroundColor;
        --any-comp-foreground-color:@@foregroundColor;
    }
    @.mainScroll{
        border:var(--any-comp-border-color) 1px solid;
        border-radius:4px;
        margin-top:1rem;
    }
    @.mainScrollContainer{
        display:flex;
        flex-direction:column;
        position:relative;
        padding:1rem;
    }
    @.inputContainer{
        padding:1rem;
        gap:2rem;
        border-top:1px solid var(--any-comp-border-color);
    }
    @.inputContainer:first-child{
        border-top:none;
    }
    @.bottomButtons{
        gap:1rem;
    }
    @.bottomButtons .SlimButton{
        opacity:0.5;
        margin:0 0.1rem;
    }
    @.input{
        all:unset;
        background:var(--any-comp-input-bg);
        border-radius:4px;
        padding:0.5rem;
        height:80px;
    }
    @.layout{
        gap:1rem 2rem;
    }
    @.btn.active{
        opacity:1;
    }
    @.line{
        gap:1rem;
    }
    @.scroll{
        border:var(--any-comp-border-color) 1px solid;
        border-radius:4px;
        margin-bottom:1rem;
    }
    @.scroll.hide{
        display:none;
    }
    @.scrollContainer{
        display:flex;
        flex-direction:column;
        gap:2rem;
    }
`});
