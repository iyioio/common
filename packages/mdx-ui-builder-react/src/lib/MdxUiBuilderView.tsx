// @ts-ignore
import { Fragment, jsx, jsxs } from "react/jsx-runtime";

import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutProps, getErrorMessage } from "@iyio/common";
import { MdxUiBuilder, MdxUiBuilderError, MdxUiBuilderOptions, MdxUiImportReplacer, MdxUiLiveComponentGenerator } from "@iyio/mdx-ui-builder";
import { ErrorBoundary, Text, View, useSubject } from "@iyio/react-common";
import { useEffect, useMemo, useRef } from "react";
import { MdxUiBuilderErrorView } from "./MdxUiBuilderErrorView";


export interface MdxUiBuilderViewProps
{
    code?:string;
    onChange?:(code:string)=>void;
    components?:Record<string,any>;
    imports?:Record<string,any>;
    builderOptions?:MdxUiBuilderOptions;
    liveComponentGenerator?:MdxUiLiveComponentGenerator;
    importReplacer?:MdxUiImportReplacer;
    onError?:(error:MdxUiBuilderError|null)=>void;
    hideError?:boolean;
}

export function MdxUiBuilderView({
    code,
    onChange,
    components,
    imports,
    builderOptions,
    liveComponentGenerator,
    importReplacer,
    onError,
    hideError,
    ...props
}:MdxUiBuilderViewProps & BaseLayoutProps){

    const refs=useRef({builderOptions,liveComponentGenerator,importReplacer});

    const builder=useMemo(()=>{

        const compilerOptions={...refs.current.builderOptions?.compilerOptions}
        if(refs.current.importReplacer){
            compilerOptions.importReplacer=refs.current.importReplacer;
        }

        return new MdxUiBuilder({
            ...refs.current.builderOptions,
            liveComponentGenerator:refs.current.liveComponentGenerator??refs.current.builderOptions?.liveComponentGenerator,
            enableLiveComponents:true,
            reactImports:{Fragment,jsx,jsxs},
            compilerOptions,
        });

    },[]);

    useEffect(()=>{
        builder.highlighter.mode='hover';
        return ()=>{
            builder.dispose();
        }
    },[builder]);

    useEffect(()=>{
        builder.liveImports=imports??null;
    },[imports,builder]);

    useEffect(()=>{
        builder.liveComponents=components??null;
    },[components,builder]);

    useEffect(()=>{
        builder.code=code??null;
    },[code,builder]);

    const state=useSubject(builder.stateSubject);
    const error=state.error;

    const compRef=useSubject(builder.lastLiveComponentSubject);
    const Comp=compRef?.Comp;

    useEffect(()=>{
        onError?.(error??null);
    },[onError,error]);

    return (
        <div className={style.root(null,null,props)} key={compRef?.compileId}>

            <ErrorBoundary fallbackWithError={(err)=>(
                <View col>
                    <Text text="Runtime Error"/>
                    <Text sm colorMuted text="Your component compiled but may fail at runtime when a user is using it." mb1 mt050/>
                    {getErrorMessage(err)}
                </View>
            )}>
                {Comp && <Comp isPreview/>}
            </ErrorBoundary>

            {error && !hideError && <MdxUiBuilderErrorView absBottomCenter m1 error={error} />}

        </div>
    )

}

const style=atDotCss({name:'MdxUiBuilderView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        flex:1;
        position:relative;
    }
`});
