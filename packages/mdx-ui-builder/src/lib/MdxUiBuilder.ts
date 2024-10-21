import { DisposeContainer, InternalOptions, ReadonlySubject, asArray, delayAsync, escapeHtml, getErrorMessage, removeEmptyLinesAtIndex, setIndentation } from "@iyio/common";
import { parse as parseJson5 } from 'json5';
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { MdxUiHighlighter, MdxUiHighlighterOptions } from "./MdxUiHighlighter";
import { MdxUiTextEditor } from "./MdxUiTextEditor";
import { areMdxUiSelectionEqual, isMdxUiCachedComponentExpired, isMdxUiNodeTextEditableById, mergeMdxUiSelection } from "./mdx-ui-builder-lib";
import { MdxUiAtt, MdxUiBuilderState, MdxUiCachedComponent, MdxUiCodeInjections, MdxUiCompileOptions, MdxUiCompileResult, MdxUiComponentCache, MdxUiComponentFn, MdxUiComponentFnRef, MdxUiDragDropSource, MdxUiLiveComponentGenerator, MdxUiNode, MdxUiNodeMetadata, MdxUiReactImports, MdxUiSelection, MdxUiSelectionDirection, MdxUiSelectionEvt, MdxUiSelectionItem } from "./mdx-ui-builder-types";
import { compileMdxUiAsync } from "./mdx-ui-compiler";

let instId=0;

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

    cache?:MdxUiComponentCache;

    cacheKey?:string;

    cacheTtl?:number;

    disableCacheRead?:boolean;

    disableCacheWrite?:boolean;
}

type OptionalProps='reactImports'|'liveComponentGenerator'|'compilerOptions'|'cache'|'cacheKey'|'cacheTtl';
type OmitProps='highlighter';

export class MdxUiBuilder
{

    public readonly highlighter:MdxUiHighlighter;

    private readonly options:InternalOptions<MdxUiBuilderOptions,OptionalProps,OmitProps>;

    private readonly instId:number;

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

    private readonly _dragDropSource:BehaviorSubject<MdxUiDragDropSource|null>=new BehaviorSubject<MdxUiDragDropSource|null>(null);
    public get dragDropSourceSubject():ReadonlySubject<MdxUiDragDropSource|null>{return this._dragDropSource}
    public get dragDropSource(){return this._dragDropSource.value}
    public set dragDropSource(value:MdxUiDragDropSource|null){
        if(value==this._dragDropSource.value){
            return;
        }
        this._dragDropSource.next(value);
    }

    public constructor({
        highlighter={},
        compileDelayMs=16,
        enableLiveComponents=false,
        reactImports=undefined,
        liveComponentGenerator,
        compilerOptions,
        cache,
        cacheKey,
        cacheTtl,
        setCodeOnSubmit=false,
        disableCacheWrite=false,
        disableCacheRead=false,
    }:MdxUiBuilderOptions={}){
        this.instId=++instId;
        this.options={
            compileDelayMs,
            enableLiveComponents,
            reactImports,
            liveComponentGenerator,
            compilerOptions,
            setCodeOnSubmit,
            cache,
            cacheKey,
            cacheTtl,
            disableCacheWrite,
            disableCacheRead,
        }
        this.highlighter=new MdxUiHighlighter(highlighter,this);
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
                    onSubmit:(nodeId:string,code:string)=>this.replaceNodeCode(nodeId,code),
                    onMove:(direction,relativeTo)=>this.moveSelection(direction,relativeTo),
                }));
            }
        }
    }

    public replaceNodeCode(nodeId:string,code:string){
        const node=this.getNode(nodeId);
        if(!node){
            return false;
        }
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

        this.submitCodeChange(codeUpdate,true);

        return true;
    }

    public submitCodeChange(code:string,skipCompare=false):boolean
    {

        if(!skipCompare && code===this.getLastCompiledSourceCode()){
            return false;
        }

        if(this.options.setCodeOnSubmit){
            this.code=code;
        }
        this._onCodeChangeSubmission.next(code);

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

    public getNode(id:string):MdxUiNode|undefined{
        return this.lastCompileResult?.sourceMap?.lookup[id];
    }

    public getNodeMetadata(id:string):MdxUiNodeMetadata|undefined{
        return this.lastCompileResult?.sourceMap?.metadata[id];
    }

    public createSelectionItem(id:string):MdxUiSelectionItem|undefined{

        const node=this.getNode(id);
        if(!node){
            return undefined;
        }

        const metadata=this.getNodeMetadata(id);
        const isComp=(
            node.type==="mdxJsxFlowElement" &&
            node.name.substring(0,1)===node.name.substring(0,1).toUpperCase()
        );

        const item:MdxUiSelectionItem={
            id:id,
            getTarget:()=>globalThis.document?.getElementsByClassName(id).item(0)??undefined,
            node,
            metadata,
            textEditable:metadata?.textEditable?true:false,
            componentType:isComp?node.name:undefined
        }

        return item;
    }

    public selectById(id:string):boolean{

        const item=this.createSelectionItem(id);
        if(!item){
            return false;
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

        let cached:MdxUiCachedComponent|undefined;
        if(this.options.cacheKey && this.options.cache && !this.options.disableCacheRead){
            cached=this.options.cache.getCompSync(this.options.cacheKey,this.options.cacheTtl);
            if(!cached){
                cached=await this.options.cache.getCompAsync(this.options.cacheKey,this.options.cacheTtl);
            }
            if(isMdxUiCachedComponentExpired(cached)){
                cached=undefined;
            }
        }

        const code=cached?.compileResult?.code??this.code;
        const injections=this.injections;

        if(code==null || code===undefined){
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
            const sourceMap=(
                this.options.compilerOptions?.sourceMap===false?
                    undefined
                :this.options.compilerOptions?.sourceMap===true?
                    {}
                :
                    (this.options.compilerOptions?.sourceMap??{})
            );
            if(sourceMap){
                sourceMap.idPrefix=this.instId+'-';
            }
            const compiled=cached?.compileResult??await compileMdxUiAsync(
                ((injections?.prefix || injections?.suffix)?
                    (injections.prefix??'')+code+(injections.suffix??'')
                :
                    code
                ),
                {
                    ...this.options.compilerOptions,
                    sourceMap,
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
                live=cached?.Comp??await this.createLiveComponentAsync(compiled,this.options.reactImports);
                if(compileId!==this.compileId){
                    return;
                }
                if(cached && !cached.Comp){
                    cached.Comp=live;
                }
            }

            let putCachedPromise:Promise<any>|undefined;
            if(this.options.cache && this.options.cacheKey && !cached?.compileResult && !this.options.disableCacheWrite){
                putCachedPromise=this.options.cache.putCompAsync(
                    this.options.cacheKey,
                    compiled,
                    this.options.cacheTtl
                );
            }

            const liveRef:MdxUiComponentFnRef|undefined=live?{Comp:live,compileId}:undefined;
            const selection=this.selection;
            this._state.next({
                status:'complied',
                compiled,
                live:liveRef,
                compileId
            });
            this._lastCompileResult.next(compiled);
            this._lastLiveComponent.next(liveRef??null);
            if(selection){
                this.reselect(selection);
            }
            await putCachedPromise;
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

    /**
     * Attempts to reselect a selection that has been lost due to a re-compile
     */
    public reselect(selection:MdxUiSelection):boolean{
        const map=this.lastCompileResult?.sourceMap;
        if(!map){
            this.selection=null;
            return false;
        }
        const items:MdxUiSelectionItem[]=[];
        for(const item of selection.all){

            const idMatch=map.lookup[item.id];
            if( idMatch &&
                idMatch.type===item.node.type &&
                idMatch.name===item.node.name
            ){
                const s=this.createSelectionItem(item.id);
                if(s){
                    items.push(s);
                    continue;
                }
            }

            if(!item.node.position){
                continue;
            }

            for(const id in map.lookup){
                const node=map.lookup[id];
                if(!node?.position){
                    continue;
                }
                if( node.position.start.offset===item.node.position.start.offset &&
                    node.type===item.node.type &&
                    node.name===item.node.name
                ){
                    const s=this.createSelectionItem(id);
                    if(s){
                        items.push(s);
                    }
                }
            }
        }

        if(items.length){
            this.selection={
                item:items[0] as MdxUiSelectionItem,
                all:items,
            }
            return true;
        }else{
            this.selection=null;
            return false;
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

    public setElementProps(nodeId:string,props:Record<string,any>,dropProps?:boolean):boolean{

        const node=this.getNode(nodeId);
        if(!node){
            return false;
        }

        const code=this.getLastCompiledSourceCode();
        const pos=node.position;

        if(!code || !pos || node.type!=="mdxJsxFlowElement"){
            return false;
        }

        const attPosMap:Record<string,number>={};

        const out:string[]=[];

        if(node.attributes?.length){
            const first=node.attributes[0];
            if(first?.position){
                const startCode=code.substring(pos.start.offset,first.position.start.offset);
                if(startCode.length>1 && startCode[startCode.length-1]===' '){
                    out.push(startCode.substring(0,startCode.length-1));
                    out.push(' ');
                }else{
                    out.push(startCode);
                }
            }
            let prev:MdxUiAtt|undefined;
            for(const att of node.attributes){
                if(!att.position){
                    continue;
                }

                if(prev?.position){
                    out.push(code.substring(prev.position.end.offset,att.position.start.offset));
                }

                attPosMap[att.name]=out.length;
                out.push(code.substring(att.position.start.offset,att.position.end.offset));


                prev=att;
            }
            if(!prev?.position){
                return false;
            }
            out.push(code.substring(prev.position.end.offset,pos.end.offset));
        }else{
            const close=code.indexOf('>',pos.start.offset);
            if(close===-1){
                return false;
            }
            out.push(code.substring(pos.start.offset,close));
            out.push(code.substring(close,pos.end.offset));
        }

        const updated:string[]=[];

        for(const name in props){
            const v=props[name];
            if(v===undefined || (name==='className' && v==='')){
                continue;
            }
            const type=typeof v;
            if(type==='symbol' || type==='function'){
                updated.push(name);
                continue;
            }

            const insertIndex=attPosMap[name];

            const attValue=(typeof v === 'string'?
                `${name}="${escapeHtml(v)}"`
            :v===true?
                name
            :
                `${name}={${tryParse(v)}}`
            )

            if(insertIndex===undefined){
                out.splice(out.length-1,0,' '+attValue);
            }else{
                out[insertIndex]=attValue;
            }

            updated.push(name);
        }

        if(dropProps){
            for(const name in attPosMap){
                if(updated.includes(name)){
                    continue;
                }
                const index=attPosMap[name];
                if(index===undefined){
                    continue;
                }
                out[index]='';
                if(out[index-1]?.trim()===''){
                    out[index-1]='';
                }
            }
        }

        return this.replaceNodeCode(nodeId,out.join(''));

    }

    public insertDragDropSource(
        src:MdxUiDragDropSource,
        targetId:string
    ):boolean{

        if(!targetId){
            return false;
        }

        const target=this.createSelectionItem(targetId);
        const pos=target?.node.position;

        if(!pos){
            return false;
        }

        const code=src.getSourceCode?.(target)??src.sourceCode;
        if(!code){
            return false;
        }

        const srcCode=this.getLastCompiledSourceCode();
        if(srcCode===undefined){
            return false;
        }

        let index=pos.start.offset;
        let indent=false;
        if(target.metadata?.open){
            indent=true;
            index=pos.end.offset;
            index=srcCode.lastIndexOf('</',index);
            if(index===-1){
                return false;
            }

        }

        const nl=srcCode.lastIndexOf('\n',index);
        const before=srcCode.substring(nl+1,index);
        const sp=/^[ \t]+$/.test(before)?before:'';

        const codeUpdate=(
            srcCode?.substring(0,index)+
            (indent?'    ':'')+
            ((sp || indent)?setIndentation(sp.length+(indent?4:0),code).trim():code)+
            '\n\n'+
            sp+
            srcCode?.substring(index)
        );

        this.submitCodeChange(codeUpdate,true);

        return true;

    }

    public deleteItem(itemOrId:MdxUiSelectionItem|string|null|undefined):boolean
    {
        return this.deleteById((typeof itemOrId === 'string')?itemOrId:itemOrId?.id);
    }

    public deleteSelection(selection:MdxUiSelection|null|undefined):boolean{
        return this.deleteById(selection?.all.map(i=>i.id));
    }

    public deleteById(id:string|string[]|null|undefined):boolean{
        if(!id){
            return false;
        }

        const removeFromSelection:string[]=[];

        const map=this.lastCompileResult?.sourceMap;
        if(!map){
            return false;
        }

        const nodes:MdxUiNode[]=[];

        id=asArray(id);

        for(const i of id){
            const node=map.lookup[i];
            if(node){
                nodes.push(node);
            }
            if(this.selection?.all.some(s=>s.id===i)){
                removeFromSelection.push(i);
            }
        }

        if(!nodes.length){
            return false;
        }

        // Remove nodes contained within other nodes
        nodes:for(let i=0;i<nodes.length;i++){
            const node=nodes[i] as MdxUiNode;
            if(!node?.position){
                continue;
            }

            for(let x=0;x<nodes.length;x++){
                if(i===x){
                    continue;
                }
                const outer=nodes[x] as MdxUiNode
                if(!outer?.position){
                    continue;
                }

                if( node.position.start.offset>=outer.position.start.offset &&
                    node.position.end.offset<=outer.position.end.offset
                ){
                    nodes.splice(i,1);
                    i--;
                    continue nodes;
                }
            }
        }

        nodes.sort((a,b)=>(b.position?.start.offset??0)-(a.position?.start.offset??0));

        let code=this.getLastCompiledSourceCode()??'';
        if(!code){
            return false;
        }

        for(const node of nodes){
            if(!node.position){
                continue;
            }
            code=code.substring(0,node.position.start.offset)+code.substring(node.position.end.offset);
            code=removeEmptyLinesAtIndex(code,node.position.start.offset);
        }

        if(removeFromSelection.length && this.selection){
            if(removeFromSelection.length===this.selection.all.length){
                this.selection=null;
            }else{
                const all=this.selection.all.filter(item=>!removeFromSelection.includes(item.id));
                const first=all[0];
                if(all.length===0 || !first){
                    this.selection=null;
                }else{
                    this.selection={
                        item:first,
                        all,
                    }
                }
            }
        }

        this.submitCodeChange(code,true);

        return true;
    }

}

const tryParse=(value:any):string=>{
    try{
        return parseJson5(value);
    }catch(ex){
        console.error('Failed to parse builder value',value,ex);
        return 'null'
    }
}
