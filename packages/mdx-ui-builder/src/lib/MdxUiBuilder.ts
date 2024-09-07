import { DisposeContainer, InternalOptions, ReadonlySubject, delayAsync, getErrorMessage } from "@iyio/common";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { MdxUiHighlighter, MdxUiHighlighterOptions } from "./MdxUiHighlighter";
import { MdxUiTextEditor } from "./MdxUiTextEditor";
import { areMdxUiSelectionEqual, isMdxUiNodeTextEditableById, mergeMdxUiSelection } from "./mdx-ui-builder-lib";
import { MdxUiBuilderState, MdxUiCodeInjections, MdxUiCompileOptions, MdxUiCompileResult, MdxUiComponentFn, MdxUiComponentFnRef, MdxUiLiveComponentGenerator, MdxUiNode, MdxUiReactImports, MdxUiSelection, MdxUiSelectionDirection, MdxUiSelectionEvt, MdxUiSelectionItem } from "./mdx-ui-builder-types";
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

    setCodeOnSubmit?:boolean;
}

type OptionalProps='reactImports'|'liveComponentGenerator'|'compilerOptions';
type OmitProps='highlighter';

export class MdxUiBuilder
{

    public readonly highlighter:MdxUiHighlighter;

    private readonly options:InternalOptions<MdxUiBuilderOptions,OptionalProps,OmitProps>;

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

    private readonly _onCodeChangeSubmission=new Subject<string>();
    public get onCodeChangeSubmission():Observable<string>{return this._onCodeChangeSubmission}

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

    private readonly _selection:BehaviorSubject<MdxUiSelection|null>=new BehaviorSubject<MdxUiSelection|null>(null);
    public get selectionSubject():ReadonlySubject<MdxUiSelection|null>{return this._selection}
    public get selection(){return this._selection.value}
    public set selection(value:MdxUiSelection|null){
        if(value==this._selection.value){
            return;
        }
        this._selection.next(value);
    }



    public constructor({
        highlighter={},
        compileDelayMs=1000,
        enableLiveComponents=false,
        reactImports=undefined,
        liveComponentGenerator,
        compilerOptions,
        setCodeOnSubmit=false,
    }:MdxUiBuilderOptions={}){
        this.options={
            compileDelayMs,
            enableLiveComponents,
            reactImports,
            liveComponentGenerator,
            compilerOptions,
            setCodeOnSubmit,
        }
        this.highlighter=new MdxUiHighlighter(highlighter);
        this.disposables.add(this.highlighter);
        this.disposables.addSub(this.highlighter.onSelection.subscribe(this.onSelection));
        this.disposables.addSub(this.selectionSubject.subscribe(this.onSelectionChange));
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
        this.selectionCleanup?.dispose();
        this._state.next({status:'disposed',compileId:this.compileId});
    }

    public getLastCompiledSourceCode(){
        return this._lastCompileResult.value?.sourceMap?.sourceCode;
    }

    private readonly onSelection=(evt:MdxUiSelectionEvt)=>{

        if(areMdxUiSelectionEqual(evt.selection,this.selection)){
            return;
        }

        evt.mouseEvent?.preventDefault();

        let selection=evt.selection;
        if(selection){
            if(this.selection && (evt.mouseEvent?.shiftKey || evt.mouseEvent?.metaKey)){
                selection=mergeMdxUiSelection(this.selection,selection);
            }
            this._selection.next(selection);
        }else{
            this._selection.next(null);
        }
    }

    private selectionCleanup?:DisposeContainer;
    private readonly onSelectionChange=(selection:MdxUiSelection|null)=>{

        this.selectionCleanup?.dispose();
        const cleanup=new DisposeContainer();
        this.selectionCleanup=cleanup;

        const lc=this.lastCompileResult;

        this.highlighter.highlighIds=selection?.all.length?selection.all.map(i=>i.id):null;

        if(!selection || !lc){
            return;
        }

        if(selection.all.length===1 && lc.sourceMap){
            const node=lc.sourceMap?.lookup[selection.item.id];
            if(node && isMdxUiNodeTextEditableById(selection.item.id,lc.sourceMap)){
                cleanup.add(new MdxUiTextEditor({
                    item:selection.item,
                    node,
                    lookupClassNamePrefix:lc.sourceMap.lookupClassNamePrefix,
                    onSubmit:this.onSubmitTextEdit,
                    onMove:(direction,relativeTo)=>this.moveSelection(direction,relativeTo),
                }));
            }
        }
    }

    private readonly onSubmitTextEdit=(code:string,node:MdxUiNode)=>{
        const pos=node.position;
        if(!pos){
            return false;
        }

        const lastCode=this.getLastCompiledSourceCode();
        let codeUpdate=lastCode;
        if(codeUpdate===undefined){
            return false;
        }

        codeUpdate=codeUpdate.substring(0,pos.start.offset??0)+code+codeUpdate.substring(pos.end.offset??0);
        if(codeUpdate===lastCode){
            return false;
        }


        if(this.options.setCodeOnSubmit){
            this.code=codeUpdate;
        }
        this._onCodeChangeSubmission.next(codeUpdate);

        return true;
    }

    public moveSelection(direction:MdxUiSelectionDirection,relativeToId?:string):boolean{

        const map=this.lastCompileResult?.sourceMap;
        if(!map){
            return false;
        }

        if(!relativeToId){
            relativeToId=this.selection?.item.id;
            if(!relativeToId){
                return false;
            }
        }

        let index=map.nodesIds.indexOf(relativeToId);
        if(index===-1){
            return false;
        }
        let id:string|undefined;

        if(typeof direction === 'number'){
            id=map.nodesIds[index+direction];
        }else{
            while(true){
                index+=(direction==='forwards'?1:-1);
                const nid=map.nodesIds[index];
                if(nid===undefined){
                    break;
                }
                if(globalThis.document?.getElementsByClassName(nid).item(0)){
                    id=nid;
                    break;
                }
            }
        }
        if(id===undefined){
            return false;
        }

        return this.selectById(id);
    }

    public selectById(id:string):boolean{
        const target=globalThis.document?.getElementsByClassName(id).item(0);
        if(!target){
            return false;
        }

        const item:MdxUiSelectionItem={
            id:id,
            target,
        }

        this._selection.next({
            item,
            all:[item],
        });

        return true;
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
