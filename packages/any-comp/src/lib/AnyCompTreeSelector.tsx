import { atDotCss } from "@iyio/at-dot-css";
import { getDirectoryName } from "@iyio/common";
import { ScrollView, SlimButton, Text } from "@iyio/react-common";
import { Fragment, useState } from "react";
import { AcCompRegistry } from "./any-comp-types";

export interface AnyCompTreeSelectorProps
{
    reg?:AcCompRegistry;
    compId?:string;
    onCompIdChange?:(id:string)=>void;
    className?:string;
}

export function AnyCompTreeSelector({
    reg,
    compId,
    onCompIdChange,
    className,
}:AnyCompTreeSelectorProps){

    let lastDir:string|null=null;

    const [filter,setFilter]=useState('');
    const lf=filter.toLowerCase().trim();

    return (
        <div className={style.root(null,className)}>

            <input
                className={style.input()}
                type="text"
                value={filter}
                onChange={e=>setFilter(e.target.value)}
                placeholder="Search"
            />

            <ScrollView flex1 col containerClassName={style.scrollContainer()}>
                {reg?.comps.map(c=>{

                    if(lf && !c.name.toLowerCase().includes(lf)){
                        return null;
                    }

                    const dir=getDirectoryName(c.path);
                    const ld=lastDir;
                    lastDir=dir;

                    return (
                        <Fragment key={c.id}>
                            {dir!==ld && <Text className={style.dir()} text={dir} title={dir} singleLine />}
                            <SlimButton className={style.item({selected:c.id===compId})} onClick={()=>onCompIdChange?.(c.id)}>
                                <Text text={c.name}/>
                                {c.id===compId && <Text className={style.arrow()} text=">" />}
                            </SlimButton>
                        </Fragment>
                    )
                })}
            </ScrollView>

        </div>
    )

}

const style=atDotCss({name:'AnyCompTreeSelector',css:`
    @.root{
        display:flex;
        flex-direction:column;
        min-width:300px;
    }
    @.dir{
        margin-top:0.5rem;
        font-size:10px;
        opacity:0.5;
    }
    @.item{
        padding-left:1rem;
        font-size:12px;
        margin-top:0.2rem;
        position:relative;
        color:var(--any-comp-foreground-color);
    }
    @.item.selected{
        text-decoration:underline;
    }
    @.arrow{
        position:absolute;
        left:0;
        top:50%;
        transform:translateY(-50%);
    }
    @.scrollContainer{
        padding:0.5rem;
    }
    @.input{
        all:unset;
        background:var(--any-comp-input-bg);
        border-radius:4px;
        padding:0.5rem;
        margin:0.5rem;
    }
`});
