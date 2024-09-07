import { DisposeContainer, InternalOptions, snakeCaseToCamelCase } from "@iyio/common";
import TurndownService from 'turndown';
import { removeMdxUiPrefixClassName } from "./mdx-ui-builder-lib";
import { MdxUiNode, MdxUiSelectionDirection, MdxUiSelectionItem } from "./mdx-ui-builder-types";


let td:TurndownService|undefined;
const getTd=()=>{
    if(td){
        return td;
    }
    td=new TurndownService({
        headingStyle:'atx',
        hr:'---',
        bulletListMarker:'-',
        emDelimiter:'*',
        strongDelimiter:'**',
        linkStyle:'inlined',
    });

    td.keep(['span']);

    return td;
}

export interface MdxUiTextEditorOptions
{
    item:MdxUiSelectionItem;
    node:MdxUiNode;
    lookupClassNamePrefix?:string;
    onSubmit?:(code:string,node:MdxUiNode)=>void;
    onMove?:(direction:MdxUiSelectionDirection,relativeToId:string)=>void;
}

export class MdxUiTextEditor
{

    private readonly options:InternalOptions<MdxUiTextEditorOptions,'onSubmit'|'onMove'|'lookupClassNamePrefix'>;

    public readonly startingCode:string;

    public constructor({
        item,
        node,
        lookupClassNamePrefix,
        onSubmit,
        onMove,
    }:MdxUiTextEditorOptions){

        this.options={
            item,
            node,
            lookupClassNamePrefix,
            onSubmit,
            onMove,
        }

        this.startingCode=this.getCode();

        item.target.setAttribute('contenteditable','true');
        this.disposables.addCb(()=>this.options.item.target.removeAttribute('contenteditable'));

        item.target.addEventListener('blur',this.onBlur);
        this.disposables.addCb(()=>item.target.removeEventListener('blur',this.onBlur));

        item.target.addEventListener('keydown',this.onKey as any);
        this.disposables.addCb(()=>item.target.removeEventListener('keydown',this.onKey as any));

        if(item.target instanceof HTMLElement){
            item.target.focus();
            const sel=globalThis.window?.getSelection();
            if(sel){
                sel.selectAllChildren(item.target);
            }
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
        this.disposables.dispose();
    }

    private readonly onBlur=(evt:Event)=>{
        evt.preventDefault();
        this.submit();
    }

    private readonly onKey=(evt:KeyboardEvent)=>{
        if(evt.key==='Enter' && (evt.shiftKey || evt.metaKey)){
            evt.preventDefault();
            this.submit();
        }else if(evt.key==='Tab'){
            evt.preventDefault();
            this.submit();
            this.move(evt.shiftKey?'backwards':'forwards');
        }

    }

    private submit(){
        const code=this.getCode();
        if(code!==this.startingCode){
            this.options.onSubmit?.(code,this.options.node);
        }
        this.dispose();
    }

    private move(direction:MdxUiSelectionDirection){
        this.options.onMove?.(direction,this.options.item.id);
    }

    public getCode():string{
        const clone=this.options.item.target.cloneNode(true) as Element;
        if(this.options.lookupClassNamePrefix){
            removeMdxUiPrefixClassName(clone,this.options.lookupClassNamePrefix);
        }
        if(!clone.className){
            clone.removeAttribute('class');
        }
        replaceStyleAtts(clone);
        clone.removeAttribute('contenteditable');
        return replaceStyle(getTd().turndown(clone.outerHTML));
    }
}

const replaceStyleAtts=(elem:Element)=>{
    const style=elem.getAttribute('style');
    if(elem.className){
        elem.setAttribute(attPlaceholder+'class_name',elem.className);
        elem.removeAttribute('class');
    }
    if(style){
        elem.removeAttribute('style');
        elem.setAttribute(attPlaceholder+'style',style);
    }
    for(let i=0;i<elem.children.length;i++){
        const child=elem.children.item(i);
        if(child){
            replaceStyleAtts(child);
        }

    }
}

const attPlaceholder='data-mdx_ui_builder_attribute_placeholder_';

const replaceStyle=(html:string):string=>{
    return html.replace(/data-mdx_ui_builder_attribute_placeholder_(\w+)\s*=\s*"([^"]*)"/g,(_,att:string,value:string)=>{
        if(att==='style'){
            const obj:Record<string,string>={};
            const pairs=value.split(';');
            for(let i=0;i<pairs.length;i++){
                const p=pairs[i] as string;
                const c=p.indexOf(':');
                if(c===-1){
                    continue;
                }
                obj[p.substring(0,c).trim()]=p.substring(c+1).trim();

            }
            return `style={${JSON.stringify(obj)}}`;
        }else{
            return `${snakeCaseToCamelCase(att)}="${value}"`;
        }
    })
}
