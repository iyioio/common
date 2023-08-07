import { ReadonlySubject, deepClone, escapeHtml } from '@iyio/common';
import { BehaviorSubject } from 'rxjs';
import { getDefaultRTxtNodeDescriptors } from "./rtxt-descriptors";
import { getRTxtLineNodes } from './rtxt-lib';
import { insertRTxtViewerStyleSheet } from './rtxt-style-renderer';
import { RTxtDescriptor, RTxtDoc, RTxtNode, RTxtRenderOptions, RTxtStyleProvider, defaultRTxtClassNamePrefix, defaultRTxtDocClassName, defaultRTxtLineElem, defaultRTxtNodeType, rTxtAttPrefix, rTxtDocAtt, rTxtIndexLookupAtt, rTxtLineAlignAtt, rTxtLineIndexAtt, rTxtNodeAtt, rTxtTypeAtt } from "./rtxt-types";

export class RTxtRenderer
{

    public readonly elem:HTMLElement|null;

    public readonly options:RTxtRenderOptions;

    public readonly descriptors:Record<string,RTxtDescriptor>;

    private readonly _editMode:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(false);
    public get editModeSubject():ReadonlySubject<boolean>{return this._editMode}
    public get editMode(){return this._editMode.value}
    public set editMode(value:boolean){
        if(value==this._editMode.value){
            return;
        }
        this._editMode.next(value);
    }

    private readonly _doc:BehaviorSubject<RTxtDoc>;
    public get docSubject():ReadonlySubject<RTxtDoc>{return this._doc}
    public get doc(){return this._doc.value}
    public set doc(value:RTxtDoc){
        if(value==this._doc.value){
            return;
        }
        this._doc.next(value);
    }

    public nodeLookup:RTxtNode[]=[];

    public constructor(options:RTxtRenderOptions,skipRender=false){

        const {
            target,
            doc,
            descriptors,
            useCustomStyleSheet,
            docClassName=defaultRTxtDocClassName,
        }=options;
        this.options={...options};
        Object.freeze(this.options);

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

        for(let li=0;li<this.doc.lines.length;li++){
            const line=this.doc.lines[li];
            if(!line){
                continue;
            }
            if(lineBreaks && buffer.length){
                buffer.push('<br/>');
            }

            const lineObj=Array.isArray(line)?undefined:line;

            buffer.push(`<${lineElem}${
                lineObj?.align && lineObj.align!=='start'?` style="text-align:${lineObj.align==='end'?'right':'center'}"`:''
            }${this.editMode?` ${rTxtNodeAtt}="1" ${rTxtLineAlignAtt}="${lineObj?.align??'start'}" ${rTxtLineIndexAtt}="${li}"`:''}>`);

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

        }


        if(this.elem){
            this.elem.innerHTML=buffer.join('');
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

            buffer.push(`<${elemType} ${rTxtNodeAtt}="1"`);
            if(this.editMode && ti==0){
                buffer.push(` ${rTxtTypeAtt}="${escapeHtml(types.join(','))}" ${rTxtIndexLookupAtt}="${ctx.nodeIndex}"`);
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

                className=(this.options.classPrefix??defaultRTxtClassNamePrefix)+className;

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
