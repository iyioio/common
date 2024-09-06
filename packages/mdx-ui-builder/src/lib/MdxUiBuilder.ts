import { DisposeContainer, ReadonlySubject, delayAsync, getErrorMessage } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { MdxUiHighlighter, MdxUiHighlighterOptions } from "./MdxUiHighlighter";
import { MdxUiBuilderState, MdxUiCodeInjections, MdxUiCompileOptions, MdxUiCompileResult, MdxUiComponentFn, MdxUiComponentFnRef, MdxUiLiveComponentGenerator, MdxUiReactImports } from "./mdx-ui-builder-types";
import { compileMdxUiAsync } from "./mdx-ui-compiler";

export interface MdxUiBuilderOptions
{

    /**
     * Options to pass to the highlighter
     */
    highlighter?:MdxUiHighlighterOptions;

    /**
     * Number of milliseconds to delay between the code prop being updated and compilation starting
     */
    compileDelayMs?:number;

    compilerOptions?:MdxUiCompileOptions;

    /**
     * If true a live component will be created during compilation. reactImports must also be defined
     * to enabled auto live component compilation.
     */
    enableLiveComponents?:boolean;

    reactImports?:MdxUiReactImports;

    liveComponentGenerator?:MdxUiLiveComponentGenerator;
}

type OptionalProps='reactImports'|'liveComponentGenerator'|'compilerOptions';
type OmitProps='highlighter';

export class MdxUiBuilder
{

    public readonly highlighter:MdxUiHighlighter;

    private readonly options:(
        Required<Omit<MdxUiBuilderOptions,OmitProps|OptionalProps>> &
        Partial<Pick<MdxUiBuilderOptions,OptionalProps>>
    );

    private readonly _code:BehaviorSubject<string|null>=new BehaviorSubject<string|null>(null);
    public get codeSubject():ReadonlySubject<string|null>{return this._code}
    public get code(){return this._code.value}
    public set code(value:string|null){
        if(value==this._code.value){
            return;
        }
        this._code.next(value);
        this.compileAsync();
    }

    private readonly _lastCompileResult:BehaviorSubject<MdxUiCompileResult|null>=new BehaviorSubject<MdxUiCompileResult|null>(null);
    public get lastCompileResultSubject():ReadonlySubject<MdxUiCompileResult|null>{return this._lastCompileResult}
    public get lastCompileResult(){return this._lastCompileResult.value}

    private readonly _lastLiveComponent:BehaviorSubject<MdxUiComponentFnRef|null>=new BehaviorSubject<MdxUiComponentFnRef|null>(null);
    public get lastLiveComponentSubject():ReadonlySubject<MdxUiComponentFnRef|null>{return this._lastLiveComponent}
    public get lastLiveComponent(){return this._lastLiveComponent.value}

    private readonly _injections:BehaviorSubject<MdxUiCodeInjections|null>=new BehaviorSubject<MdxUiCodeInjections|null>(null);
    public get injectionsSubject():ReadonlySubject<MdxUiCodeInjections|null>{return this._injections}
    public get injections(){return this._injections.value}
    public set injections(value:MdxUiCodeInjections|null){
        if(value==this._injections.value){
            return;
        }
        this._injections.next(value);
        this.compileAsync();
    }


    private readonly _disableCompiling:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get disableCompilingSubject():ReadonlySubject<boolean>{return this._disableCompiling}
    public get disableCompiling(){return this._disableCompiling.value}
    public set disableCompiling(value:boolean){
        if(value==this._disableCompiling.value){
            return;
        }
        this._disableCompiling.next(value);
        this.compileAsync();
    }

    private readonly _liveImports:BehaviorSubject<Record<string,any>|null>=new BehaviorSubject<Record<string,any>|null>(null);
    public get liveImportsSubject():ReadonlySubject<Record<string,any>|null>{return this._liveImports}
    /**
     * Imports used when creating a live component
     */
    public get liveImports(){return this._liveImports.value}
    public set liveImports(value:Record<string,any>|null){
        if(value==this._liveImports.value){
            return;
        }
        this._liveImports.next(value);
        this.compileAsync();
    }

    private readonly _liveComponents:BehaviorSubject<Record<string,any>|null>=new BehaviorSubject<Record<string,any>|null>(null);
    public get liveComponentsSubject():ReadonlySubject<Record<string,any>|null>{return this._liveComponents}
    /**
     * Components used when creating a live component
     */
    public get liveComponents(){return this._liveComponents.value}
    public set liveComponents(value:Record<string,any>|null){
        if(value==this._liveComponents.value){
            return;
        }
        this._liveComponents.next(value);
        this.compileAsync();
    }

    private readonly _state:BehaviorSubject<MdxUiBuilderState>=new BehaviorSubject<MdxUiBuilderState>({status:'ready',compileId:0});
    public get stateSubject():ReadonlySubject<MdxUiBuilderState>{return this._state}
    public get state(){return this._state.value}



    public constructor({
        highlighter={},
        compileDelayMs=1000,
        enableLiveComponents=false,
        reactImports,
        liveComponentGenerator,
        compilerOptions,
    }:MdxUiBuilderOptions={}){
        this.highlighter=new MdxUiHighlighter(highlighter);
        this.disposables.add(this.highlighter);
        this.options={
            compileDelayMs,
            enableLiveComponents,
            reactImports,
            liveComponentGenerator,
            compilerOptions
        }
    }

    private readonly disposables=new DisposeContainer();
    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        this.compileId++;
        this.disposables.dispose();
        this._state.next({status:'disposed',compileId:this.compileId});
    }

    private compileId=0;

    private async compileAsync()
    {
        if(this.isDisposed){
            return;
        }

        const compileId=++this.compileId;


        if(this.disableCompiling){
            this._state.next({status:'disabled',compileId});
            return;
        }

        const code=this.code;
        const injections=this.injections;

        if(code==null){
            this._state.next({status:'ready',compileId});
            return;
        }

        const delay=this.options.compileDelayMs;
        if(delay>0){
            this._state.next({status:'waiting',compileId});

            await delayAsync(this.options.compileDelayMs);
            if(compileId!==this.compileId){
                return;
            }
        }

        this._state.next({status:'compiling',compileId});

        try{
            const compiled=await compileMdxUiAsync(
                ((injections?.prefix || injections?.suffix)?
                    (injections.prefix??'')+code+(injections.suffix??'')
                :
                    code
                ),
                {
                    ...this.options.compilerOptions,
                    sourceMap:this.options.compilerOptions?.sourceMap||true,
                    discardReplaced:this.options.enableLiveComponents,
                    mdxJsOptions:this.options.enableLiveComponents?{
                        ...this.options.compilerOptions?.mdxJsOptions,
                        outputFormat:'function-body',
                        baseUrl:'./',
                    }:this.options.compilerOptions?.mdxJsOptions
                }
            )
            if(compileId!==this.compileId){
                return;
            }

            let live:MdxUiComponentFn|undefined;
            if(this.options.enableLiveComponents && this.options.reactImports){
                live=await this.createLiveComponentAsync(compiled,this.options.reactImports);
                if(compileId!==this.compileId){
                    return;
                }
            }

            const liveRef:MdxUiComponentFnRef|undefined=live?{Comp:live,compileId}:undefined;
            this._state.next({
                status:'complied',
                compiled,
                live:liveRef,
                compileId
            });
            this._lastCompileResult.next(compiled);
            this._lastLiveComponent.next(liveRef??null);
        }catch(ex){
            console.log('hio 👋 👋 👋 ERRRO',ex);
            if(compileId!==this.compileId){
                return;
            }
            this._state.next({
                status:'error',
                compileId,
                error:{
                    error:ex,
                    message:getErrorMessage(ex),
                    code,
                }
            })
        }
    }

    private async createLiveComponentAsync(
        compiled:MdxUiCompileResult,
        reactImports:MdxUiReactImports
):Promise<MdxUiComponentFn>{

        const imports={...this.liveImports};
        const components={...this.liveComponents};

        const src:string[]=['(()=>async function compFn(_,imports){'];
        for(const name in imports){
            src.push(`const ${name}=imports.${name};`);
        }
        src.push(compiled.code);
        src.push('})()');

        const fn=eval(src.join('\n'));

        let Comp=await fn(reactImports,imports);
        if(Comp.default){
            Comp=Comp.default;
        }

        if(this.options.liveComponentGenerator){
            for(const r of compiled.importReplacements){
                const c=this.options.liveComponentGenerator(r);
                if(c){
                    components[r.importName]=c;
                }
            }
        }

        return (props?:Record<string,any>)=>{
            return reactImports.jsxs(Comp,{components,...props})
        }
    }



}
