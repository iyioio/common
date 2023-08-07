import { ReadonlySubject, aryRemoveItem, convertRgbToHex, deepClone, escapeHtml, isDomNodeDescendantOf } from "@iyio/common";
import { BehaviorSubject } from "rxjs";
import { RTxtRenderer } from "./RTxtRenderer";
import { convertRTxtDocToSingleCharNodes, elemToRTxtDoc, getRTxtNodeLine, getRTxtNodesLines, getRTxtSelection, selectRTxtSelection, sortRTxtNodeTypes } from "./rtxt-lib";
import { insertRTxtEditorStyleSheet } from "./rtxt-style-editor";
import { getDefaultRTxtTools } from "./rtxt-tools";
import { RTxtAlignment, RTxtDescriptor, RTxtDoc, RTxtEditorOptions, RTxtLine, RTxtNode, RTxtSelection, RTxtTool, RTxtToolSelection, defaultRTxtClassNamePrefix, defaultRTxtLineElem, defaultRTxtNodeType, rTxtDocAtt, rTxtIndexLookupAtt, rTxtLineIndexAtt, rTxtNodeAtt } from "./rtxt-types";

export class RTxtEditor
{

    public readonly renderer:RTxtRenderer;

    public menu:HTMLElement|null;

    private readonly _selection:BehaviorSubject<RTxtSelection|null>=new BehaviorSubject<RTxtSelection|null>(null);
    public get selectionSubject():ReadonlySubject<RTxtSelection|null>{return this._selection}
    public get selection(){return this._selection.value}

    public readonly defaultDoc:RTxtDoc;

    public readonly tools:RTxtTool[];

    public readonly options:RTxtEditorOptions;

    public constructor(options:RTxtEditorOptions){

        const {
            renderer,
            useCustomStyleSheet,
            tools=getDefaultRTxtTools(renderer instanceof RTxtRenderer?renderer.options:renderer),
        }=options;

        this.options=options;

        if(renderer instanceof RTxtRenderer){
            this.renderer=renderer;
        }else{
            this.renderer=new RTxtRenderer(renderer,true);
        }

        this.tools=tools;

        convertRTxtDocToSingleCharNodes(this.renderer.doc);

        this.renderer.editMode=true;

        this.defaultDoc=deepClone(this.renderer.doc);

        if(!useCustomStyleSheet){
            insertRTxtEditorStyleSheet();
        }

        globalThis.document?.addEventListener('selectionchange',this.onSelectionChange);

        this.menu=this.renderMenu();

        if(this.renderer.elem){
            this.renderer.elem.addEventListener('input',this.onInput);
            this.renderer.elem.contentEditable='true';
            this.renderer.render();
        }

    }

    private _isDisposed=false;
    public get isDisposed(){return this._isDisposed}
    public dispose()
    {
        if(this._isDisposed){
            return;
        }
        this._isDisposed=true;
        globalThis.document?.removeEventListener('selectionchange',this.onSelectionChange);
        if(this.renderer.elem){
            this.renderer.elem.removeEventListener('input',this.onInput);
        }
        this.menu?.remove();
    }

    private readonly onInput=()=>{
        this.syncElemToDoc();
    }

    private readonly onSelectionChange=()=>{
        const sel=globalThis.document?.getSelection();
        if( !sel ||
            !sel.rangeCount ||
            !sel.anchorNode ||
            !sel.focusNode ||
            (sel.anchorNode===sel.focusNode && sel.anchorOffset===sel.focusOffset) ||
            !isDomNodeDescendantOf(sel.anchorNode,this.renderer.elem,true) ||
            !isDomNodeDescendantOf(sel.focusNode,this.renderer.elem,true)
        ){
            if( !sel ||
                (
                    !isDomNodeDescendantOf(sel.anchorNode,this.menu,false) &&
                    !isDomNodeDescendantOf(sel.focusNode,this.menu,false)
                )
            ){
                this._selection.next(null);
                this.deselectAllTools();
                this.hideMenu();
            }
            return;
        }
        const selection=getRTxtSelection(sel,this.renderer.nodeLookup,this.renderer.elem);
        this._selection.next(selection);
        //console.info('selection',selection,selection?rTxtSelectionToString(selection,this.renderer.nodeLookup):null);

        const pos=sel.getRangeAt(0).getBoundingClientRect();

        if(selection){
            this.setToolSelection(selection);
        }else{
            this.deselectAllTools();
        }

        this.showMenu(pos.left+pos.width/2,pos.top,pos.bottom);
    }

    private deselectAllTools(){
        const className=`${this.renderer.options.classPrefix??defaultRTxtClassNamePrefix}selected`;
        for(const group of this.toolElemGroupings){
            for(const elem of group.elems){
                elem.classList.remove(className);
            }
            group.tool.onSelectionChange?.({
                editor:this,
                selection:null,
                descriptors:[],
                nodes:[],
                lines:[],
                toolElems:group.elems,
                toolElem:group.elems[0],
            });
        }
    }

    private setToolSelection(selection:RTxtSelection){
        const className=`${this.renderer.options.classPrefix??defaultRTxtClassNamePrefix}selected`;
        const singleAry:string[]=[''];

        const elemAtCursor=this.getElementAt(selection.cursorIndex);
        const styleAtCursor=elemAtCursor?globalThis.window?.getComputedStyle?.(getDeepestElem(elemAtCursor)):undefined;
        const colorAtCursor=styleAtCursor?.color?convertRgbToHex(styleAtCursor.color):undefined;
        const sizeAtCursor=styleAtCursor?.fontSize;
        const nodeAtCursor=this.renderer.nodeLookup[selection.cursorIndex];

        for(const group of this.toolElemGroupings){

            const types:string[]=[];
            const nodes:RTxtNode[]=[];
            const lines:RTxtLine[]=[];
            for(const node of selection.nodes){
                let nodeTypes:string[];
                if(!node.t){
                    continue;
                }
                if(typeof node.t === 'string'){
                    singleAry[0]=node.t;
                    nodeTypes=singleAry;
                }else{
                    nodeTypes=node.t;
                }
                for(const type of nodeTypes){
                    if(group.tool.types.includes(type)){
                        nodes.push(node);
                        const nodeLine=getRTxtNodeLine(this.renderer.doc,node);
                        if(nodeLine && !lines.includes(nodeLine)){
                            lines.push(nodeLine);
                        }
                        if(!types.includes(type)){
                            types.push(type);
                        }
                    }
                }
            }


            let toolSel:RTxtToolSelection;
            if(types.length){
                const decs:RTxtDescriptor[]=[];
                for(const type of types){
                    const desc=this.renderer.descriptors[type];
                    if(!desc){
                        continue;
                    }
                    decs.push(desc);
                }
                toolSel={
                    editor:this,
                    selection,
                    descriptors:decs,
                    nodes,
                    lines,
                    toolElems:group.elems,
                    toolElem:group.elems[0],
                    elemAtCursor,
                    styleAtCursor,
                    colorAtCursor,
                    sizeAtCursor,
                    nodeAtCursor,
                };
            }else{
                toolSel={
                    editor:this,
                    selection,
                    descriptors:[],
                    nodes:[],
                    lines,
                    toolElems:group.elems,
                    toolElem:group.elems[0],
                    elemAtCursor,
                    styleAtCursor,
                    colorAtCursor,
                    sizeAtCursor,
                    nodeAtCursor,
                };
            }
            for(const elem of group.elems){
                if(group.tool.isSelected){
                    if(group.tool.isSelected(toolSel)){
                        elem.classList.add(className);
                    }else{
                        elem.classList.remove(className);
                    }
                }else{
                    if(types.length){
                        elem.classList.add(className);
                    }else{
                        elem.classList.remove(className);
                    }
                }
            }
            group.tool.onSelectionChange?.(toolSel);

        }
    }

    private toolElemGroupings:ToolGrouping[]=[];

    private renderMenu():HTMLElement|null
    {
        const container=globalThis.document?.createElement('div');
        const menu=globalThis.document?.createElement('div');
        if(!container || !menu){
            return null;
        }
        const classPrefix=this.renderer.options.classPrefix??defaultRTxtClassNamePrefix;
        container.classList.add(classPrefix+'editor-menu-container');
        container.classList.add(classPrefix+'editor-menu-container-closed');

        container.appendChild(menu);
        menu.classList.add(`${classPrefix}editor-menu`);

        this.toolElemGroupings=[];

        for(const tool of this.tools){

            const elem=tool.render(this);
            if(!elem){
                continue;
            }

            const grouping:ToolGrouping={tool,elems:[]}
            this.toolElemGroupings.push(grouping);

            if(Array.isArray(elem)){
                for(const e of elem){
                    menu.appendChild(e);
                    grouping.elems.push(e);
                }
            }else{
                menu.append(elem);
                grouping.elems.push(elem);
            }

        }


        global.document?.body.appendChild(container);
        return container;
    }

    private menuVisible=false;

    public showMenu(left:number,top:number,bottom:number)
    {
        if(!this.menu){
            return;
        }

        let y=top-this.menu.clientHeight;
        if(y<2){
            y=bottom;
        }

        this.menu.style.transform=`translate(${Math.round(left-this.menu.clientWidth/2)}px,${Math.round(y)}px)`

        if(!this.menuVisible){
            this.menuVisible=true;
            this.menu.classList.remove(
                (this.renderer.options.classPrefix??defaultRTxtClassNamePrefix)+
                'editor-menu-container-closed'
            );
        }
    }

    public hideMenu()
    {
        if(!this.menuVisible || !this.menu){
            return;
        }
        this.menuVisible=false;
        this.menu.classList.add(
            (this.renderer.options.classPrefix??defaultRTxtClassNamePrefix)+
            'editor-menu-container-closed'
        );
    }

    public toggleSelection(selection:RTxtSelection,nodeType:string,atts?:Record<string,string>){
        if(this.allHaveNodeType(selection,nodeType)){
            this.removeFromSelection(selection,nodeType);
        }else{
            this.applyToSection(selection,nodeType,atts);
        }
    }

    public applyToSection(selection:RTxtSelection,nodeType:string,atts?:Record<string,string>){

        for(const node of selection.nodes){
            if(!node.t){
                node.t=[];
            }
            if(typeof node.t === 'string'){
                node.t=[node.t];
            }
            if(!node.t.includes(nodeType)){
                const desc=this.renderer.descriptors[nodeType];
                if(desc?.group){
                    for(let i=0;i<node.t.length;i++){
                        const otherDesc=this.renderer.descriptors[node.t[i]??''];
                        if(otherDesc?.group===desc.group){
                            otherDesc.remove?.(node);
                            node.t.splice(i,1);
                            i--;
                        }
                    }
                }
                node.t.push(nodeType);
                sortRTxtNodeTypes(node,this.renderer.descriptors);
            }

            if(atts){
                if(!node.atts){
                    node.atts={};
                }
                for(const e in atts){
                    const v=atts[e];
                    if(v!==undefined){
                        node.atts[e]=v;
                    }
                }
            }
        }
    }

    public removeFromSelection(selection:RTxtSelection,nodeType:string){

        for(const node of selection.nodes){
            if(!node.t){
                node.t=[];
            }
            if(typeof node.t === 'string'){
                node.t=[node.t];
            }
            if(aryRemoveItem(node.t,nodeType)){
                const desc=this.renderer.descriptors[nodeType];
                desc?.remove?.(node);
            }
        }
    }

    public someHaveNodeType(selection:RTxtSelection,nodeType:string):boolean{
        for(const node of selection.nodes){
            if(typeof node.t === 'string'){
                if(node.t===nodeType){
                    return true;
                }
            }else if(node.t?.length){
                if(node.t.includes(nodeType)){
                    return true;
                }
            }else if(nodeType===defaultRTxtNodeType){
                return true;
            }
        }
        return false;
    }

    public allHaveNodeType(selection:RTxtSelection,nodeType:string):boolean{
        for(const node of selection.nodes){
            if(typeof node.t === 'string'){
                if(node.t!==nodeType){
                    return false;
                }
            }else if(node.t?.length){
                if(!node.t.includes(nodeType)){
                    return false;
                }
            }else if(nodeType!==defaultRTxtNodeType){
                return false;
            }
        }
        return true;
    }

    public syncElemToDoc()
    {
        const selection=globalThis.document?.getSelection();
        const caretNode=(selection && selection?.anchorNode===selection?.focusNode)?selection.anchorNode:null;
        let setCaretElem:Element|null=null;
        let reRender=false;

        const docElem=this.renderer.elem;
        if(!docElem){
            return;
        }

        let hasChange=false;

        const lineElemType=this.renderer.options.lineElem??defaultRTxtLineElem;

        let lineIndex=0;
        let nodeIndex=0;
        let lastFormattedElem:Element|null=null;
        for(let i=0;i<docElem.childNodes.length;i++){
            const lineElem=docElem.childNodes.item(i);
            if(!lineElem){
                continue;
            }

            if(!(lineElem instanceof Element)){
                hasChange=true;
                reRender=true;
                const replaceWith=globalThis.document?.createElement(lineElemType);
                if(replaceWith){
                    replaceWith.textContent=lineElem.textContent;
                    docElem.insertBefore(replaceWith,lineElem);
                }
                lineElem.remove();
                continue;
            }

            const lineIsNode=lineElem.getAttribute(rTxtNodeAtt);
            if(!lineIsNode){
                hasChange=true;
                reRender=true;
                lineElem.innerHTML=`<${lineElemType}>${escapeHtml(lineElem.textContent??'')}</${lineElemType}>`;
            }

            const lineAttValue=lineElem.getAttribute(rTxtLineIndexAtt);
            if(!lineAttValue || lineAttValue!==lineIndex.toString()){
                hasChange=true;
                lineElem.setAttribute(rTxtLineIndexAtt,lineIndex.toString());
            }



            for(let li=0;li<lineElem.childNodes.length;li++){
                let _elem=lineElem.childNodes.item(li);
                if(!_elem){
                    continue;
                }

                if(!(_elem instanceof Element)){
                    const replaceWith:Element=globalThis.document?.createElement(defaultRTxtNodeType);
                    replaceWith.textContent=_elem.textContent;
                    lineElem.insertBefore(replaceWith,_elem);
                    _elem.remove();
                    _elem=replaceWith;
                }

                let elem=_elem as Element;

                if(elem.getAttribute(rTxtNodeAtt)){
                    lastFormattedElem=elem;
                }else if(lastFormattedElem){
                    reRender=true;
                    hasChange=true;
                    const replaceWith=lastFormattedElem.cloneNode(true) as Element;
                    replaceWith.textContent=elem.textContent;
                    lineElem.insertBefore(replaceWith,elem);
                    elem.remove();
                    elem=replaceWith;
                }else if(hasForeignElems(elem)){
                    reRender=true;
                    hasChange=true;
                    elem.innerHTML=escapeHtml(elem.textContent??'');
                }

                const indexAttValue=elem.getAttribute(rTxtIndexLookupAtt);
                if(!indexAttValue || indexAttValue!==nodeIndex.toString()){
                    hasChange=true;
                    elem.setAttribute(rTxtIndexLookupAtt,nodeIndex.toString());
                }


                const hasFocus=caretNode?true:false;

                const textNode=getTextNode(elem);
                if(textNode?.textContent && textNode.textContent.length!==1){

                    hasChange=true;

                    //split
                    const text=textNode.textContent;
                    textNode.textContent=text[0]??null;

                    const elemNode=getNodeElem(textNode);
                    if(!elemNode){
                        break;
                    }

                    const insertBefore=elemNode.nextSibling;

                    for(let ti=1;ti<text.length;ti++){
                        const char=text[ti];
                        const nextNode=elemNode.cloneNode(true) as Element;
                        nextNode.setAttribute(rTxtIndexLookupAtt,nodeIndex.toString());

                        const nextTextNode=getTextNode(nextNode);
                        if(nextTextNode){
                            nextTextNode.textContent=char??null;
                        }
                        elemNode.parentElement?.insertBefore(nextNode,insertBefore);

                        if(hasFocus){
                            setCaretElem=nextNode;
                        }
                    }
                }
                nodeIndex++;
            }

            lineIndex++;

        }

        if(hasChange){
            const {doc,lookup}=elemToRTxtDoc(docElem);
            this.renderer.nodeLookup=lookup;
            this.renderer.doc=doc;
        }

        if(reRender){
            const caretIndex=setCaretElem?.getAttribute(rTxtIndexLookupAtt);
            this.renderer.render();
            if(caretIndex){
                setCaretElem=docElem.querySelector(`[${rTxtIndexLookupAtt}='${caretIndex}']`);
            }
        }

        const caretTo=setCaretElem?getTextNode(setCaretElem):null;
        if(caretTo && selection){
            selection.collapse(caretTo,caretTo.textContent?.length||1);
        }
    }

    public getElementAt(index:number):Element|undefined{
        const docElem=this.renderer.elem;
        if(!docElem){
            return undefined;
        }

        return docElem.querySelector(`[${rTxtIndexLookupAtt}='${index}']`)??undefined;
    }

    public getStyleAt(index:number):CSSStyleDeclaration|undefined{
        const elem=this.getElementAt(index);
        if(!elem){
            return undefined;
        }

        return globalThis.window?.getComputedStyle?.(getDeepestElem(elem))??undefined;
    }

    public getCursorLine():RTxtLine|undefined{
        const node=this.selection?.cursorNode;
        if(!node){
            return undefined;
        }
        return getRTxtNodeLine(this.renderer.doc,node);
    }

    public getSelectedLines():RTxtLine[]{
        if(!this.selection){
            return [];
        }
        return getRTxtNodesLines(this.renderer.doc,this.selection.nodes);
    }

    public setSelectedLineAlignment(align:RTxtAlignment)
    {
        const sel=this.selection;
        const elem=this.renderer.elem;
        const lines=this.getSelectedLines();
        for(const line of lines){
            if(align==='start'){
                delete line.align;
            }else{
                line.align=align;
            }
        }
        this.renderer.render();
        if(sel && elem){
            selectRTxtSelection(sel,elem);
        }
    }
}


const getTextNode=(elem:Node):Text|null=>{
    if(elem.childNodes.length!==1){
        return null;
    }

    const child=elem.firstChild;
    if(!child){
        return null;
    }
    if(child instanceof Text){
        return child;
    }

    return getTextNode(child);
}


const getDeepestElem=(elem:Element):Element=>{
    if(elem.childNodes.length!==1){
        return elem;
    }

    const child=elem.firstChild;
    if(!child || !(child instanceof Element)){
        return elem;
    }

    return getDeepestElem(child);
}

const getNodeElem=(node:Node):Element|null=>{
    while(node){
        if(!node.parentElement || !node.parentNode){
            return null;
        }
        if(node.parentElement.getAttribute(rTxtLineIndexAtt) || node.parentElement.getAttribute(rTxtDocAtt))
        {
            return node instanceof Element?node:null;
        }
        node=node.parentNode;
    }
    return null;

}

const hasForeignElems=(elem:Element):boolean=>{

    if(!elem.getAttribute(rTxtNodeAtt)){
        return true;
    }

    for(let i=0;i<elem.children.length;i++){
        const child=elem.children[i];
        if(!child){
            continue;
        }
        if(hasForeignElems(child)){
            return true;
        }
    }

    return false;
}

interface ToolGrouping{
    tool:RTxtTool;
    elems:Element[];
}
