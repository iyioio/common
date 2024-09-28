import { atDotCss } from "@iyio/at-dot-css";
import { BaseLayoutOuterProps, ElementSizeObserver } from "@iyio/common";
import { useEffect, useState } from "react";

export interface AlignmentTransitionProps
{
    row?:boolean;
    align?:'start'|'end'|'center'|number;
    children?:any;
    durationMs?:string;
}

export function AlignmentTransition({
    align,
    row=false,
    durationMs='0.2s',
    children,
    ...props
}:AlignmentTransitionProps & BaseLayoutOuterProps){

    const [root,setRoot]=useState<HTMLElement|null>(null);
    const [container,setContainer]=useState<HTMLElement|null>(null);

    useEffect(()=>{

        if(!root || !container){
            return;
        }

        let rootSize={width:0,height:0};
        let containerSize={width:0,height:0};

        const update=()=>{
            if(align==='start'){
                container.style.transform='';
                return;
            }

            const rs=row?rootSize.height:rootSize.width;
            const cs=row?containerSize.height:containerSize.width;

            let diff:number;

            if(typeof align === 'number'){
                diff=(rs-cs)*align;
            }else if(align==='center'){
                diff=(rs-cs)/2;
            }else{
                diff=rs-cs;
            }

            container.style.transform=`translate${row?'Y':'X'}(${diff}px)`;
        }

        const rootOb=new ElementSizeObserver(root);
        const containerOb=new ElementSizeObserver(container);

        const rootSub=rootOb.sizeSubject.subscribe(v=>{
            rootSize=v;
            update();
        });
        const containerSub=containerOb.sizeSubject.subscribe(v=>{
            containerSize=v;
            update();
        });

        return ()=>{
            rootSub.unsubscribe();
            rootOb.dispose();
            containerSub.unsubscribe();
            containerOb.dispose();
        }


    },[root,container,align,row]);


    return (
        <div className={style.root({row},null,props)} ref={setRoot} style={style.vars({durationMs})}>

            <div ref={setContainer} className={style.container({row})}>
                {children}
            </div>

        </div>
    )

}

const style=atDotCss({name:'AlignmentTransition',namespace:'iyio',order:'framework',css:`
    @.root{
        display:flex;
        flex-direction:column;
        align-items:flex-start;
    }
    @.root.row{
        flex-direction:row;
    }
    @.container{
        display:flex;
        flex-direction:column;
        flex:1;
        transition:transform @@durationMs ease-in-out;
    }
    @.container.row{
        flex-direction:row;
    }
`});
