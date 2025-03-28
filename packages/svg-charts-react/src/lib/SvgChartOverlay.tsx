import { atDotCss } from "@iyio/at-dot-css";
import { formatNumberWithBases } from "@iyio/common";
import { Portal } from "@iyio/react-common";
import { SvgBaseChartCtrl, classNamePrefix } from "@iyio/svg-charts";
import { useEffect, useState } from "react";

interface SvgChartOverlayProps
{
    title?:string;
    ctrl:SvgBaseChartCtrl|null|undefined;
}

export function SvgChartOverlay({
    title,
    ctrl
}:SvgChartOverlayProps){

    const [elem,setElem]=useState<HTMLElement|null>(null);
    const [itemsElem,setItemsElem]=useState<HTMLElement|null>(null);

    useEffect(()=>{

        if(!ctrl || !elem || !itemsElem){
            return;
        }

        const sub=ctrl.intersectionsSubject.subscribe(v=>{

            if(v.length===0){
                elem.style.display='none';
                return;
            }


            const x=v[0].clientX;
            const y=v.reduce((p,c)=>Math.min(p,c.clientY),Number.MAX_VALUE);

            elem.style.display='flex';
            elem.style.transform=`translate(${x}px,${y}px)`;

            itemsElem.innerHTML=v.map((v,i)=>{
                console.log(v);
                let timestampStr = '';
                if (v.timestamp) {
                    const date = new Date(v.timestamp);
                    const month = date.toLocaleString('default', { month: 'short' });
                    const day = date.getDate();
                    const year = date.getFullYear();
                    timestampStr = `${month} ${day}, ${year}: `;
                }
                return`
                <div class="${classNamePrefix}overlay-item ${classNamePrefix}${i%2?'even':'odd'}">
                    <div class="${classNamePrefix}overlay-item-color ${classNamePrefix}${i%2?'even':'odd'}"></div>
                    <div class="${classNamePrefix}overlay-item-value"> ${timestampStr} ${formatNumberWithBases(v.value,100)}</div>
                </div>
            `
            }).join('')
        })

        return ()=>{
            sub.unsubscribe();
        }
    },[ctrl,elem,itemsElem])

    return (
        <>

            <Portal active>
                <div className={style.root()} ref={setElem} id={ctrl?ctrl.id:undefined}>
                    <div className={style.body(null,classNamePrefix+'overlay-body')}>
                        {!!title && <div className={classNamePrefix+'overlay-title'}>{title}</div>}
                        <div ref={setItemsElem} className={classNamePrefix+'overlay-items'}/>
                    </div>
                </div>
            </Portal>
        </>
    )

}


const style=atDotCss({name:'SvgChartOverlay',css:`
    @.root{
        position:absolute;
        left:0;
        top:0;
        pointer-events:none;
        display:none;
        z-index:1000;
    }
    @.body{
        transform:translate(-50%,calc(-100% - 20px))
    }
`});
