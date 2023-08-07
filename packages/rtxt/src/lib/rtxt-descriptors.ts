import { RTxtDescriptor } from "./rtxt-types";

export const getDefaultRTxtNodeDescriptors=():RTxtDescriptor[]=>[
    {
        type:'size1',
        group:'size',
        elem:'span',
        priority:-100,
    },
    {
        type:'size2',
        group:'size',
        elem:'span',
        priority:-100,
    },
    {
        type:'size3',
        group:'size',
        elem:'span',
        priority:-100,
    },
    {
        type:'color',
        elem:'span',
        priority:-80,
        style:node=>({
            color:node.atts?.['color']
        }),
        remove:node=>delete node.atts?.['color'],
    },
    {
        type:'font',
        elem:'span',
        priority:-90,
        inlineStyle:node=>({
            ['font-family']:node.atts?.['font']
        }),
        className:node=>node.atts?.['fontClass'],
        remove:node=>{
            delete node.atts?.['font'];
            delete node.atts?.['fontClass'];
        }
    },
    {
        type:'span',
        elem:'span',
    },
    {
        type:'b',
        elem:'b',
    },
    {
        type:'s',
        elem:'s',
        priority:100
    }
]
