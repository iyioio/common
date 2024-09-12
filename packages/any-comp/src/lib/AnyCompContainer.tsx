import { atDotCss } from "@iyio/at-dot-css";
import { ErrorBoundary, ScrollView, SlimButton, Text, View, useSubject } from "@iyio/react-common";
import { useEffect, useState } from "react";
import { AnyComp } from "./AnyComp";
import { AnyCompPropsView } from "./AnyCompPropsView";
import { useCreateAnyCompViewCtrl } from "./any-comp-react-lib";
import { acStyle } from "./any-comp-style";
import { AcComp, AcTaggedPropRenderer } from "./any-comp-types";
import { defaultAcPropRenderers } from "./default-prop-renderers";


export interface AnyCompContainerProps
{
    comp?:AcComp;
    placeholder?:any;
    canvasSize?:'min'|'split'|'max';
    onCanvasSizeChange?:(value:'min'|'split'|'max')=>void;
    renderers?:AcTaggedPropRenderer[];
}

export function AnyCompContainer({
    comp,
    placeholder,
    canvasSize='split',
    onCanvasSizeChange,
    renderers,
}:AnyCompContainerProps){

    const ctrl=useCreateAnyCompViewCtrl(comp);

    const requiredProps=useSubject(ctrl?.requiredPropsSubject);
    const resetKey=useSubject(ctrl?.resetKeySubject);
    const saved=useSubject(ctrl?.savedSubject);

    useEffect(()=>{
        ctrl?.load();
    },[ctrl]);

    useEffect(()=>{
        if(!ctrl){
            return;
        }
        ctrl.renderers=renderers??defaultAcPropRenderers;
    },[ctrl,renderers]);

    const [display,setDisplay]=useState<(typeof displays)[number]>('flexColumn');
    const [justify,setJustify]=useState<(typeof justifyTypes)[number]|undefined>(undefined);
    const [align,setAlign]=useState<(typeof alignTypes)[number]|undefined>(undefined);

    console.log('hio 👋 👋 👋 render container',);

    return (
        <div className={style.root()}>

            {requiredProps?.length?
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
                                key={resetKey}
                                ctrl={ctrl??undefined}
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
                    <SlimButton onClick={()=>ctrl?.save()}>(Save)</SlimButton>
                    {saved && <>
                        <SlimButton onClick={()=>ctrl?.clearSaved()}>(Delete)</SlimButton>
                        <SlimButton onClick={()=>ctrl?.load()}>(Load)</SlimButton>
                    </>}
                    <SlimButton onClick={()=>ctrl?.reset()}>(Reset)</SlimButton>
                </View>
            </View>
            <ScrollView flex1 className={style.scroll({hide:canvasSize==='max'})} containerClassName={style.scrollContainer()}>
                <View col className={style.inputContainer()} key={resetKey}>

                    <Text lg text="Props" />

                    <AnyCompPropsView ctrl={ctrl??undefined}/>

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
        color:${acStyle.var('foregroundColor')};
    }
    @.mainScroll{
        border:${acStyle.var('borderColor')} 1px solid;
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
        border-top:1px solid ${acStyle.var('borderColor')};
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
        background:${acStyle.var('inputBg')};
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
        border:${acStyle.var('borderColor')} 1px solid;
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
