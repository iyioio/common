import { baseLayoutAnimationProps, baseLayoutBreakpointProps, baseLayoutColorBaseProps, baseLayoutColorMappedProps, baseLayoutColumnProps, baseLayoutFlexProps, baseLayoutFontProps, baseLayoutGapProps, baseLayoutInnerFlexProps, baseLayoutInnerGridProps, baseLayoutMarginProps, baseLayoutPaddingProps, baseLayoutParentLayoutProps, baseLayoutSelfFlexProps, baseLayoutUtilProps } from "./base-layout";
import { generateBaseLayoutBreakpointCss } from "./base-layout-generator";
import { BaseLayoutCssGenerationOptions } from "./base-layout-generator-types";

export const getBaseLayoutDocs=(options:BaseLayoutCssGenerationOptions):string=>{
    const lines:string[]=[];
    generateBaseLayoutBreakpointCss({...options,includeAnimations:true,lines});
    const propMap:Record<string,string>={};

    for(let i=0;i<lines.length;i++){
        let line=lines[i];
        if(!line?.startsWith('.io')){
            lines.splice(i,1);
            i--;
            continue;
        }

        line=line.substring(3,4).toLowerCase()+line.substring(4);
        const nvMatch=nameValueReg.exec(line);
        if(nvMatch){
            const sub=nvMatch[2];
            let name=nvMatch[1] as string;
            if(name.includes('.')){
                const names=name.split(',');
                name=names[0] as string;
                for(let n=1;n<names.length;n++){
                    const nn=names[n] as string;
                    lines.splice(i+n,0,`${nn}${sub}{${nvMatch[3]}}`);

                }
            }
            line=`- ${name} - ${sub}${sub?'{':''}${nvMatch[3]}${sub?'}':''}`;
            propMap[name]=line;
        }

    }

    const grouped:string[]=[];

    for(const groupName in baseLayoutDocGroups){
        const group=baseLayoutDocGroups[groupName];
        if(!group){
            continue;
        }
        grouped.push(`### ${groupName}`);
        grouped.push(group.comment);
        grouped.push('');
        for(const p in group.props){
            const line=propMap[p];
            if(line){
                grouped.push(line);
            }
        }
        grouped.push('\n');

    }


    return grouped.join('\n');
}

const nameValueReg=/^([\w\-,\.]+)([^\{]*)\{([^}]+)\}$/;

export const baseLayoutDocGroups:Record<string,BaseLayoutDocGroup>={
    margin:{
        props:baseLayoutMarginProps,
        comment:'Controls margin',
    },
    padding:{
        props:baseLayoutPaddingProps,
        comment:'Controls padding',
    },
    gap:{
        props:baseLayoutGapProps,
        comment:'Controls gap',
    },
    flex:{
        props:baseLayoutFlexProps,
        comment:'Controls the flex css property',
    },
    flexLayout:{
        props:baseLayoutInnerFlexProps,
        comment:'Controls flex container properties',
    },
    selfFlex:{
        props:baseLayoutSelfFlexProps,
        comment:'Controls self flex alignment',
    },
    grid:{
        props:baseLayoutInnerGridProps,
        comment:'Defines common grid layouts',
    },
    animation:{
        props:baseLayoutAnimationProps,
        comment:'Animates css properties',
    },
    column:{
        props:baseLayoutColumnProps,
        comment:'Defines column widths',
    },
    font:{
        props:baseLayoutFontProps,
        comment:'Defines font faces and font styles',
    },
    colorBase:{
        props:baseLayoutColorBaseProps,
        comment:'Controls color css properties',
    },
    colorMapped:{
        props:baseLayoutColorMappedProps,
        comment:'Controls color css properties',
    },
    parentLayout:{
        props:baseLayoutParentLayoutProps,
        comment:'Responsive layouts',
    },
    breakpoint:{
        props:baseLayoutBreakpointProps,
        comment:'Hides or shows a component based on responsive breakpoints',
    },
    util:{
        props:baseLayoutUtilProps,
        comment:'Various utilities',
    },
}

interface BaseLayoutDocGroup
{
    props:Record<string,string>;
    comment:string;
}
