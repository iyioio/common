import { atDotCss } from "@iyio/at-dot-css";
import { useSubject } from "@iyio/react-common";
import { Fragment, useMemo } from "react";
import { AnyCompExtraPropsInput } from "./AnyCompExtraPropsInput";
import { AnyCompPropInput } from "./AnyCompPropInput";
import { AnyCompViewCtrl } from "./AnyCompViewCtrl";
import { acStyle } from "./any-comp-style";
import { AcProp, AcTaggedPropRenderer } from "./any-comp-types";

export interface AnyCompPropsViewProps
{
    ctrl?:AnyCompViewCtrl;
    ignoreProps?:string[];
}

export function AnyCompPropsView({
    ctrl,
    ignoreProps=['children'],
}:AnyCompPropsViewProps){

    const comp=ctrl?.comp;
    const renderers=useSubject(ctrl?.renderersSubject);
    const showExtra=useSubject(ctrl?.showExtraSubject);

    const lookup=useMemo(()=>{
        const lookup:Record<string,AcTaggedPropRenderer[]>={};

        if(renderers){
            for(const r of renderers){
                const key=r.tagValue?`${r.tag}:${r.tagValue??''}`:r.tag+'.';
                const ary=lookup[key]??(lookup[key]=[]);
                ary.push(r);

            }
        }

        return lookup;
    },[renderers]);

    const groups:{order:number,key:string,comp:any}[]=[];

    if(comp){
        const propGroups:Record<string,AcProp[]>={};
        for(const prop of comp.props){

            if(ignoreProps.includes(prop.name)){
                continue;
            }

            let tagged=false;

            if(prop.tags){
                for(const name in prop.tags){
                    const v:string|undefined=prop.tags[name];

                    let key=name+'.';
                    if(lookup[key]?.length){
                        tagged=true;
                        const ary=propGroups[key]??(propGroups[key]=[]);
                        ary.push(prop);
                    }

                    if(v){
                        const key=`${name}:${v??''}`;
                        if(lookup[key]?.length){
                            tagged=true;
                            const ary=propGroups[key]??(propGroups[key]=[]);
                            ary.push(prop);
                        }
                    }
                }
            }

            if(!tagged){
                groups.push({
                    key:prop.name,
                    order:0,
                    comp:(
                        <AnyCompPropInput ctrl={ctrl} prop={prop}/>
                    )
                })
            }

        }

        for(const key in propGroups){
            const props=propGroups[key];
            if(!props){
                continue;
            }
            const renderList=lookup[key];
            if(!renderList){
                continue;
            }
            for(let i=0;i<renderList.length;i++){
                const renderer=renderList[i];
                if(!renderer){continue}

                groups.push({
                    key:key+':::::::://///'+i,
                    order:renderer.order??1,
                    comp:renderer.render(comp,renderer.tag,props),
                })

            }
        }
    }

    groups.sort((a,b)=>a.key.localeCompare(b.key));
    groups.sort((a,b)=>a.order-b.order);


    return (
        <div className={style.root()}>

            {groups.map(p=>(
                <Fragment key={p.key}>
                    {p.comp}
                </Fragment>
            ))}

            {showExtra && <AnyCompExtraPropsInput ctrl={ctrl}/>}

        </div>
    )

}

const style=atDotCss({name:'AnyCompPropsView',css:`
    @.root{
        display:flex;
        flex-direction:column;
        gap:1rem;
    }
    @.input{
        all:unset;
        background:${acStyle.var('inputBg')};
        border-radius:4px;
        padding:0.5rem;
        height:80px;
    }
`});
