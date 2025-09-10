import { getRTxtIcon } from "./rtxt-icons.js";
import { getRTxtNodesTypes, selectRTxtSelection } from "./rtxt-lib.js";
import { RTxtDropdownOption, createRTxtToolButton, createRTxtToolDropdown, createRTxtToolInput, createRTxtToolLabel } from "./rtxt-tool-lib.js";
import { RTxtFontFamily, RTxtRenderOptions, RTxtTool } from "./rtxt-types.js";

export const getDefaultRTxtTools=({
    fontFamilies,
}:RTxtRenderOptions={}):RTxtTool[]=>{

    const defaults:(RTxtTool|undefined)[]=[
        !fontFamilies?undefined:createRTxtFontFamilyTool(fontFamilies),
        {
            types:['s1','s2','s3','s4','sn1','sn2','sn3','sn4'],
            render:editor=>[
                createRTxtToolLabel('Size'),
                createRTxtToolDropdown({
                    editor,
                    options:[
                        {type:'sn4',label:'-4'},
                        {type:'sn3',label:'-3'},
                        {type:'sn2',label:'-2'},
                        {type:'sn1',label:'-1'},
                        {clearGroup:'size',label:'+0'},
                        {type:'s1',label:'+1'},
                        {type:'s2',label:'+2'},
                        {type:'s3',label:'+3'},
                        {type:'s4',label:'+4'},
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
            types:['c'],
            render:(editor)=>createRTxtToolInput({
                editor,
                type:'c',
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
                    const elem=editor.renderer?.elem;
                    if(!sel){
                        return;
                    }
                    const types=getRTxtNodesTypes(sel.nodes);
                    if(types.length){
                        for(const type of types){
                            editor.removeFromSelection(sel,type);
                        }
                        editor.renderer?.render();
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
    types:['f'],
    render:editor=>[
            createRTxtToolLabel('Font'),
            createRTxtToolDropdown({
            editor,
            options:[
                {clearType:'f',label:'default'},
                ...families.map<RTxtDropdownOption>(f=>({
                    clearType:'f',
                    type:'f',
                    label:f.label,
                    atts:{font:f.family,['font-class']:f.className},
                    value:f.family??f.className??f.label,
                }))
            ]
        }),
    ],
    onSelectionChange:({toolElem,nodeAtCursor})=>{
        if(toolElem instanceof HTMLSelectElement){
            toolElem.value=nodeAtCursor?.atts?.['font']??nodeAtCursor?.atts?.['font-class']??'';
        }
    },
}
)
