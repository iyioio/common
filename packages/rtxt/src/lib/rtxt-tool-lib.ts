import type { RTxtEditor } from "./RTxtEditor";
import { selectRTxtSelection } from "./rtxt-lib";
import { defaultRTxtClassNamePrefix } from "./rtxt-types";

export interface CreateRTxtToolButtonOptions
{
    editor:RTxtEditor;
    type?:string;
    className?:string;
    innerHTML:string;
    onClick?:(editor:RTxtEditor,btn:HTMLButtonElement)=>void;
}

export const createRTxtToolButton=({
    editor,
    type,
    className,
    innerHTML,
    onClick
}:CreateRTxtToolButtonOptions):HTMLButtonElement=>{

    const btn=globalThis.document?.createElement('button');
    if(!btn){
        throw new Error('DOM methods not supported in current environment');
    }

    const classPrefix=editor.renderer.options.classPrefix??defaultRTxtClassNamePrefix;

    btn.innerHTML=innerHTML;
    btn.classList.add(`${classPrefix}button`);
    if(className){
        btn.classList.add(`${classPrefix}${className}`);
    }

    btn.addEventListener('click',()=>{
        if(type){
            const sel=editor.selection;
            const elem=editor.renderer.elem;
            if(sel && elem){
                editor.toggleSelection(sel,type);
                editor.renderer.render();
                selectRTxtSelection(sel,elem);
            }
        }
        onClick?.(editor,btn);
    });

    return btn;
}

export interface CreateRTxtToolInputOptions
{
    editor:RTxtEditor;
    type:string;
    inputType:string;
    className?:string;
    onChange?:(value:string,input:HTMLInputElement)=>(Record<string,string>|void);
    onInput?:(value:string,input:HTMLInputElement)=>(Record<string,string>|void);
}
export const createRTxtToolInput=({
    editor,
    type,
    inputType,
    className,
    onChange,
    onInput,
}:CreateRTxtToolInputOptions):HTMLInputElement=>{

    const input=globalThis.document?.createElement('input');
    if(!input){
        throw new Error('DOM methods not supported in current environment');
    }

    const classPrefix=editor.renderer.options.classPrefix??defaultRTxtClassNamePrefix;

    input.type=inputType;

    input.classList.add(`${classPrefix}input`);
    if(className){
        input.classList.add(`${classPrefix}${className}`);
    }

    const createCallback=(evtType:string,callback:(value:string,input:HTMLInputElement)=>(Record<string,string>|void))=>{
        input.addEventListener(evtType,()=>{
            const sel=editor.selection;
            const elem=editor.renderer.elem;
            if(sel && elem){
                const atts=callback(input.value,input);
                if(atts){
                    editor.applyToSection(sel,type,atts);
                }else{
                    editor.toggleSelection(sel,type);
                }
                editor.renderer.render();
                selectRTxtSelection(sel,elem);
            }
        })
    }

    if(onChange){
        createCallback('change',onChange);
    }

    if(onInput){
        createCallback('input',onInput);
    }

    return input;
}

export interface CreateRTxtToolDropdownOptions
{
    editor:RTxtEditor;
    options:RTxtDropdownOption[];
    className?:string;
    onChange?:(type:string,select:HTMLSelectElement)=>(Record<string,string>|void);
}
export interface RTxtDropdownOption
{
    type?:string;
    clearType?:string;
    clearGroup?:string;
    value?:string;
    atts?:Record<string,string|undefined>;
    label:string;
}
export const createRTxtToolDropdown=({
    editor,
    options,
    className,
    onChange,
}:CreateRTxtToolDropdownOptions):HTMLSelectElement=>{

    const select=globalThis.document?.createElement('select');
    if(!select){
        throw new Error('DOM methods not supported in current environment');
    }

    const classPrefix=editor.renderer.options.classPrefix??defaultRTxtClassNamePrefix;

    select.classList.add(`${classPrefix}select`);
    if(className){
        select.classList.add(`${classPrefix}${className}`);
    }

    for(const option of options){

        const opt=globalThis.document?.createElement('option');
        if(!opt){
            continue;
        }

        opt.innerText=option.label;
        opt.value=option.value??option.type??'';
        select.appendChild(opt);
    }

    select.addEventListener('change',()=>{
        const opt=options.find(o=>(o.value??o.type??'')===select.value);
        const sel=editor.selection;
        const elem=editor.renderer.elem;
        if(!opt || !sel || !elem){
            return;
        }

        if(opt.clearGroup){
            let changed=false;
            for(const tool of editor.tools){
                for(const type of tool.types){
                    const desc=editor.renderer.descriptors[type];
                    if(desc?.group===opt.clearGroup){
                        changed=true;
                        editor.removeFromSelection(sel,type);
                        onChange?.(type,select);
                    }
                }
            }
            if(changed){
                editor.renderer.render();
                selectRTxtSelection(sel,elem);
            }
        }

        if(opt.clearType){
            editor.removeFromSelection(sel,opt.clearType);
            editor.renderer.render();
            selectRTxtSelection(sel,elem);
            onChange?.(opt.clearType,select);
        }

        if(opt.type){
            let atts=opt.atts?{...opt.atts}:undefined;
            if(atts){
                let hasValues=false;
                for(const e in atts){
                    if(atts[e]===undefined){
                        delete atts[e];
                    }else{
                        hasValues=true;
                    }
                }
                if(!hasValues){
                    atts=undefined;
                }
            }
            editor.toggleSelection(sel,opt.type,atts as Record<string,string>|undefined);
            editor.renderer.render();
            selectRTxtSelection(sel,elem);
            onChange?.(opt.type,select);
        }

    });

    return select;
}

export const createRTxtToolLabel=(label:string):HTMLLabelElement=>{
    const elem=globalThis.document?.createElement('label');
    if(!elem){
        throw new Error('DOM methods not supported in current environment');
    }

    elem.innerText=label;

    return elem;
}
