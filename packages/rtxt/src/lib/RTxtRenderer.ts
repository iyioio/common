import { ReadonlySubject, deepClone, escapeHtml } from '@iyio/common';
import { BehaviorSubject } from 'rxjs';
import { getDefaultRTxtNodeDescriptors } from "./rtxt-descriptors";
import { getTextNode } from './rtxt-internal';
import { convertRTxtDocToSingleCharNodes, getRTxtLineNodes, minifyRTxtDoc } from './rtxt-lib';
import { insertRTxtViewerStyleSheet } from './rtxt-style-renderer';
import { RTxtDescriptor, RTxtDoc, RTxtNode, RTxtRenderOptions, RTxtStyleProvider, defaultRTxtChangeDelayMs, defaultRTxtClassNamePrefix, defaultRTxtDocClassName, defaultRTxtLineElem, defaultRTxtNodeType, rTxtAttPrefix, rTxtDocAtt, rTxtIgnoreAtt, rTxtIndexLookupAtt, rTxtLineAlignAtt, rTxtLineIndexAtt, rTxtNodeAtt, rTxtTypeAtt } from "./rtxt-types";

export class RTxtRenderer
{

    public readonly elem:HTMLElement|null;

    public readonly options:RTxtRenderOptions;

    public readonly descriptors:Record<string,RTxtDescriptor>;

    public readonly classPrefix:string;

    public isEmpty=true;

    private readonly _editMode:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get editModeSubject():ReadonlySubject<boolean>{return this._editMode}
    public get editMode(){return this._editMode.value}

    private readonly _editModeRefCount:BehaviorSubject<number>=new BehaviorSubject<number>(0);
    public get editModeRefCountSubject():ReadonlySubject<number>{return this._editModeRefCount}
    public get editModeRefCount(){return this._editModeRefCount.value}
    public set editModeRefCount(value:number){
        if(value==this._editModeRefCount.value){
            return;
        }
        const wasOn=this._editModeRefCount.value!==0;
        const isOn=value!==0;
        this._editModeRefCount.next(value);

        if(wasOn!==isOn){
            if(isOn){
                const clone=deepClone(this.doc);
                if(convertRTxtDocToSingleCharNodes(clone)){
                    this.doc=clone;
                }
                if(this.elem){
                    this.elem.contentEditable='true';
                    this.elem.classList.add(`${this.classPrefix}edit-mode`);
                }
                this._editMode.next(true);
            }else{
                this.doc=minifyRTxtDoc(this.doc);
                if(this.elem){
                    this.elem.contentEditable='false';
                    this.elem.classList.remove(`${this.classPrefix}edit-mode`);
                }
                this._editMode.next(false);
            }
            this.render();
        }

    }

    private readonly _doc:BehaviorSubject<RTxtDoc>;
    public get docSubject():ReadonlySubject<RTxtDoc>{return this._doc}
    public get doc(){return this._doc.value}
    public set doc(value:RTxtDoc){
        if(value==this._doc.value){
            return;
        }
        this._doc.next(value);
        this.queueExport();
    }

    private readonly _exportDoc:BehaviorSubject<RTxtDoc|null>=new BehaviorSubject<RTxtDoc|null>(null);
    public get exportDocSubject():ReadonlySubject<RTxtDoc|null>{return this._exportDoc}
    public get exportDoc(){return this._exportDoc.value}

    public nodeLookup:RTxtNode[]=[];

    public constructor(options:RTxtRenderOptions,skipRender=false){

        const {
            target,
            doc,
            descriptors,
            useCustomStyleSheet,
            docClassName=defaultRTxtDocClassName,
            classPrefix=defaultRTxtClassNamePrefix,
        }=options;
        this.options={...options};
        Object.freeze(this.options);

        this.classPrefix=classPrefix;

        const descAry=descriptors??getDefaultRTxtNodeDescriptors();
        this.descriptors={}
        for(const desc of descAry){
            this.descriptors[desc.type]=desc;
        }


        if(typeof target === 'string'){
            const elem=globalThis.document?.querySelector(target);
            if(!(elem instanceof HTMLElement)){
                throw new Error('Target selector did not match an HTMLElement');
            }
            this.elem=elem;
        }else{
            this.elem=target??null;
        }

        this._doc=new BehaviorSubject<RTxtDoc>(doc?deepClone(doc):{lines:[]})

        if(!useCustomStyleSheet){
            insertRTxtViewerStyleSheet(options);
        }

        if(this.elem){
            this.elem.setAttribute(rTxtDocAtt,'1');
            if(docClassName){
                this.elem.classList.add(docClassName)
            }
            if(!skipRender){
                this.render();
            }
        }
    }

    public setDoc(doc:RTxtDoc){
        doc=deepClone(doc);
        const target:any=this.doc;
        for(const e in target){
            delete target[e];
        }
        for(const e in doc){
            target[e]=(doc as any)[e];
        }
        this.render();
    }

    public render(buffer?:string[]):string[]
    {
        if(!buffer){
            buffer=[];
        }

        if(this.nodeLookup.length){
            this.nodeLookup.splice(0,this.nodeLookup.length);
        }

        const {
            lineBreaks,
            lineElem=defaultRTxtLineElem,
        }=this.options;

        const ctx:RenderContext={
            buffer,
            nodeIndex:0,
        }
        let lineIndex=0;
        for(let li=0;li<this.doc.lines.length;li++){
            const line=this.doc.lines[li];
            if(!line){
                continue;
            }

            if(!ctx.nodeIndex){
                lineIndex=0;
                if(buffer.length){
                    buffer.splice(0,buffer.length);
                }
            }

            if(lineBreaks && buffer.length){
                buffer.push('<br/>');
            }

            const lineObj=Array.isArray(line)?undefined:line;

            buffer.push(`<${lineElem}${
                lineObj?.align && lineObj.align!=='start'?` style="text-align:${lineObj.align==='end'?'right':'center'}"`:''
            }${this.editMode?` ${rTxtNodeAtt}="1" ${rTxtLineAlignAtt}="${lineObj?.align??'start'}" ${rTxtLineIndexAtt}="${lineIndex}"`:''}>`);


            const lineNodes=getRTxtLineNodes(line);
            for(let ni=0;ni<lineNodes.length;ni++){
                const node=lineNodes[ni];
                if(!node?.v){
                    continue
                }

                if(this.editMode){
                    this.nodeLookup.push(node);
                }

                if(this.editMode){
                    for(const char of node.v){
                        this.writeToBuffer(ctx,node,char,defaultRTxtNodeType);
                    }
                }else{
                    this.writeToBuffer(ctx,node,node.v,defaultRTxtNodeType);
                }

                ctx.nodeIndex++;
            }
            buffer.push(`</${lineElem}>`);

            lineIndex++;

        }

        if(!lineIndex){
            buffer.push(`<${lineElem}${this.editMode?` ${rTxtNodeAtt}="1" ${rTxtLineIndexAtt}="0"`:''}></${lineElem}>`)
        }

        const renderPlaceholder=(this.options.placeholder && !ctx.nodeIndex && this.editMode)?true:false

        if(renderPlaceholder){
            buffer.push(
                `<div class="${this.classPrefix}placeholder" contenteditable="false" ${rTxtIgnoreAtt}="1">${
                    escapeHtml(this.options.placeholder??'')
                }</div>`
            )
        }

        if(this.elem){
            this.elem.innerHTML=buffer.join('');
            this.isEmpty=ctx.nodeIndex===0;
            if(this.isEmpty){
                this.elem.classList.add(`${this.classPrefix}doc-empty`);
                if(renderPlaceholder){
                    const placeholder=this.elem.querySelector(`.${this.classPrefix}placeholder`);
                    const firstLine=this.elem.querySelector(`[${rTxtLineIndexAtt}]`)
                    if((firstLine instanceof HTMLElement) && placeholder){
                        firstLine.style.minWidth=placeholder.clientWidth+'px';
                        firstLine.style.minHeight=placeholder.clientHeight+'px';
                    }
                }
            }else{
                this.elem.classList.remove(`${this.classPrefix}doc-empty`);
            }
        }

        return buffer;
    }

    private writeToBuffer(ctx:RenderContext,node:RTxtNode,value:string,defaultElemType:string){

        const buffer=ctx.buffer;

        let types:string[];
        if(typeof node.t === 'string'){
            typeSingleAry[0]=node.t;
            types=typeSingleAry;
        }else if(node.t?.length){
            types=node.t;
        }else{
            typeSingleAry[0]=defaultElemType;
            types=typeSingleAry;
        }


        for(let ti=0;ti<types.length;ti++){
            const nodeType=types[ti];
            if(!nodeType){
                continue;
            }
            const elemTypeDesc:RTxtDescriptor|undefined=this.descriptors[nodeType];
            const elemType=elemTypeDesc?.elem??nodeType;

            buffer.push(`<${elemType}`);
            if(this.editMode && ti==0){
                buffer.push(` ${rTxtNodeAtt}="1" ${rTxtTypeAtt}="${escapeHtml(types.join(','))}" ${rTxtIndexLookupAtt}="${ctx.nodeIndex}"`);
                if(node.atts){
                    for(const e in node.atts){
                        const v=node.atts[e];
                        if(v!==undefined){
                            buffer.push(` ${rTxtAttPrefix}${e}="${escapeHtml(v)}"`);
                        }
                    }
                }
            }
            let styleMap:Record<string,boolean>|null=null;
            let firstStyle=true;

            const addStyle=(style:RTxtStyleProvider)=>{

                if(typeof style === 'function'){
                    style=style(node);
                }

                for(const e in style){
                    const value=style[e];
                    if(!value){
                        continue;
                    }
                    if(!styleMap){
                        styleMap={};
                        buffer.push(' style="')
                    }
                    if(styleMap[e]){
                        continue;
                    }
                    styleMap[e]=true;
                    buffer.push(escapeHtml(e)+':'+escapeHtml(value)+(firstStyle?'':';'))
                    firstStyle=false;
                }
            }

            const desc=this.descriptors[nodeType]??defaultDescriptor;

            if(desc.style){
                addStyle(desc.style);
            }

            if(this.options.renderMode==='inline'){
                if(desc.inlineStyle){
                    addStyle(desc.inlineStyle);
                }
            }

            if(styleMap){
                buffer.push('"');
            }

            styleMap=null;
            firstStyle=true;

            const addClass=(className:string)=>{

                className=this.classPrefix+className;

                if(!styleMap){
                    styleMap={};
                    buffer.push(' class="')
                }
                if(styleMap[className]){
                    return;
                }
                styleMap[className]=true;
                buffer.push((firstStyle?'':' ')+escapeHtml(className))
                firstStyle=false;
            }

            if(this.options.renderMode!=='inline'){
                if(elemType!==nodeType){
                    addClass(nodeType);
                }
                if(desc.className){
                    const classNames=getNodeClassNames(desc.className,node);
                    for(const e of classNames){
                        addClass(e);
                    }
                }
            }

            if(styleMap){
                buffer.push('"');
            }

            buffer.push('>');

            if(ti===types.length-1 && node.v){
                buffer.push(escapeHtml(node.v));
            }
        }

        for(let ti=types.length-1;ti>=0;ti--){
            const nodeType=types[ti];
            if(!nodeType){
                continue;
            }

            const elemTypeDesc:RTxtDescriptor|undefined=this.descriptors[nodeType];
            const elemType=elemTypeDesc?.elem??nodeType;

            buffer.push('</'+elemType+'/>');

        }
    }

    public focus()
    {
        if(!this.elem){
            return;
        }
        this.elem.focus();
        const txt=getTextNode(this.elem,true,false);
        const sel=globalThis.window?.getSelection();
        if(!txt){
            const first=this.elem.children[0];
            if(first && sel){
                sel.removeAllRanges();
                sel.collapse(first,0);
            }
            return;
        }

        if(!sel){
            return;
        }
        sel.removeAllRanges();
        sel.collapse(txt,txt.textContent?.length);
    }

    public selectAll()
    {
        if(!this.elem){
            return;
        }
        this.elem.focus();

        const sel=globalThis.window?.getSelection();
        if(!sel){
            return;
        }
        sel.removeAllRanges();
        const range=new Range();
        for(let i=0;i<this.elem.children.length;i++){
            const child=this.elem.children[i];
            if(child){
                range.selectNode(child);
            }
        }
        sel.addRange(range);
    }



    private changeIndex=0;

    public queueExport()
    {
        const index=++this.changeIndex;
        setTimeout(()=>{
            if(index!==this.changeIndex){
                return;
            }
            this._exportDoc.next(minifyRTxtDoc(this.doc));
        },this.options.changeDelayMs??defaultRTxtChangeDelayMs);
    }
}

interface RenderContext
{
    buffer:string[];
    nodeIndex:number;
}

const typeSingleAry:string[]=[''];

const singleClassNameAry:string[]=[];
const getNodeClassNames=(className:string|string[]|((node:RTxtNode)=>string|string[]|undefined),node:RTxtNode):string[]=>{

    if(typeof className === 'function'){
        const c=className(node);
        if(!c){
            return [];
        }
        className=c;
    }

    if(typeof className === 'string'){
        singleClassNameAry[0]=className;
        return singleClassNameAry;
    }else{
        return className;
    }
}

const defaultDescriptor:RTxtDescriptor={type:defaultRTxtNodeType,elem:defaultRTxtNodeType};
