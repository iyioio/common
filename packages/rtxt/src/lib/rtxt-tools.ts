import { getRTxtIcon } from "./rtxt-icons";
import { getRTxtNodeTypes, selectRTxtSelection } from "./rtxt-lib";
import { RTxtDropdownOption, createRTxtToolButton, createRTxtToolDropdown, createRTxtToolInput, createRTxtToolLabel } from "./rtxt-tool-lib";
import { RTxtFontFamily, RTxtRenderOptions, RTxtTool } from "./rtxt-types";

export const getDefaultRTxtTools=({
    fontFamilies,
}:RTxtRenderOptions={}):RTxtTool[]=>{

    const defaults:(RTxtTool|undefined)[]=[
        !fontFamilies?undefined:createRTxtFontFamilyTool(fontFamilies),
        {
            types:['size1','size2','size3'],
            render:editor=>[
                createRTxtToolLabel('Size'),
                createRTxtToolDropdown({
                    editor,
                    options:[
                        {clearGroup:'size',label:'+0'},
                        {type:'size3',label:'+1'},
                        {type:'size2',label:'+2'},
                        {type:'size1',label:'+3'},
                    ]
                })
            ],
            onSelectionChange:({toolElem,descriptors})=>{
                const d=descriptors.find(d=>d.group==='size');
                if(toolElem instanceof HTMLSelectElement){
                    toolElem.value=d?d.type:'';
                }
            },
        },
        {
            types:['b'],
            render:(editor)=>createRTxtToolButton({
                editor,
                type:'b',
                innerHTML:'B',
                className:'button-bold',
            }),
        },
        {
            types:['u'],
            render:(editor)=>createRTxtToolButton({
                editor,
                type:'u',
                innerHTML:'U',
                className:'button-underline',
            }),
        },
        {
            types:['i'],
            render:(editor)=>createRTxtToolButton({
                editor,
                type:'i',
                innerHTML:'I',
                className:'button-italic',
            }),
        },
        {
            types:['s'],
            render:(editor)=>createRTxtToolButton({
                editor,
                type:'s',
                innerHTML:'S',
                className:'button-strike',
            }),
        },
        {
            types:['color'],
            render:(editor)=>createRTxtToolInput({
                editor,
                type:'color',
                inputType:'color',
                className:'color-picker',
                onInput:v=>({color:v})
            }),
            onSelectionChange:({toolElem,colorAtCursor})=>{
                if(colorAtCursor && (toolElem instanceof HTMLInputElement)){
                    toolElem.value=colorAtCursor;
                }

            }
        },
        {
            types:[],
            render:(editor)=>createRTxtToolButton({
                editor,
                innerHTML:'clear',
                className:'button-clear',
                onClick:()=>{
                    const sel=editor.selection;
                    const elem=editor.renderer.elem;
                    if(!sel){
                        return;
                    }
                    const types=getRTxtNodeTypes(sel.nodes);
                    if(types.length){
                        for(const type of types){
                            editor.removeFromSelection(sel,type);
                        }
                        editor.renderer.render();
                    }
                    if(elem){
                        selectRTxtSelection(sel,elem);
                    }
                }
            })
        },
        {
            types:[],
            render:(editor)=>createRTxtToolButton({
                editor,
                innerHTML:getRTxtIcon({type:'alignLeft',fill:editor.options.style?.foregroundColor??'#ffffff'}),
                onClick:()=>{
                    editor.setSelectedLineAlignment('start');
                }
            }),
            isSelected:({editor})=>{
                return editor.getSelectedLines().some(l=>!l.align || l.align==='start');
            },
        },
        {
            types:[],
            render:(editor)=>createRTxtToolButton({
                editor,
                innerHTML:getRTxtIcon({type:'alignCenter',fill:editor.options.style?.foregroundColor??'#ffffff'}),
                onClick:()=>{
                    editor.setSelectedLineAlignment('center');
                }
            }),
            isSelected:({editor})=>{
                return editor.getSelectedLines().some(l=>l.align==='center');
            },
        },
        {
            types:[],
            render:(editor)=>createRTxtToolButton({
                editor,
                innerHTML:getRTxtIcon({type:'alignRight',fill:editor.options.style?.foregroundColor??'#ffffff'}),
                onClick:()=>{
                    editor.setSelectedLineAlignment('end');
                },
            }),
            isSelected:({editor})=>{
                return editor.getSelectedLines().some(l=>l.align==='end');
            },
        },
        // {
        //     types:[],
        //     render:(editor)=>createRTxtToolButton({
        //         editor,
        //         innerHTML:'🔄',
        //         className:'button-refresh',
        //         onClick:()=>{
        //             editor.renderer.setDoc(editor.defaultDoc);
        //         }
        //     })
        // },
    ]

    return defaults.filter(t=>t) as RTxtTool[];

}

export const createRTxtFontFamilyTool=(families:RTxtFontFamily[]):RTxtTool=>({
    types:['font'],
    render:editor=>[
            createRTxtToolLabel('Font'),
            createRTxtToolDropdown({
            editor,
            options:[
                {clearType:'font',label:'default'},
                ...families.map<RTxtDropdownOption>(f=>({
                    clearType:'font',
                    type:'font',
                    label:f.label,
                    atts:{font:f.family,fontClass:f.className},
                    value:f.family??f.className??f.label,
                }))
            ]
        }),
    ],
    onSelectionChange:({toolElem,nodeAtCursor})=>{
        if(toolElem instanceof HTMLSelectElement){
            toolElem.value=nodeAtCursor?.atts?.['font']??nodeAtCursor?.atts?.['fontClass']??'';
        }
    },
}
)
