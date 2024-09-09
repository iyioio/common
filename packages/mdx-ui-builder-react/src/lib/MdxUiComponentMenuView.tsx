import { AcCompRegistry } from "@iyio/any-comp";
import { atDotCss } from "@iyio/at-dot-css";
import { MdxUiBuilder, MdxUiSelectionItem } from "@iyio/mdx-ui-builder";
import { Text, useSubject } from "@iyio/react-common";
import { MdxUiComponentMenuViewInternal } from "./MdxUiComponentMenuViewInternal";

export interface MdxUiComponentMenuViewProps
{
    compReg?:AcCompRegistry;
    item?:MdxUiSelectionItem;
    builder:MdxUiBuilder;
    useSelectedItem?:boolean;
    foregroundColor?:string;
    children?:any;
}

export function MdxUiComponentMenuView({
    compReg,
    item:itemProp,
    builder,
    useSelectedItem,
    foregroundColor,
    children
}:MdxUiComponentMenuViewProps){

    const selection=useSubject(useSelectedItem?builder.selectionSubject:undefined);

    const selectionCount=selection?.all.length??0;

    const item=useSelectedItem?(selection?.all.length===1?selection.item:undefined):itemProp;

    const isTextEditable=item?.metadata?.textEditable??false;

    const compType=item?.componentType;
    const comp=compType?compReg?.comps.find(c=>c.name===item?.componentType):undefined;

    return (
        <div className={style.root()}>

            {selectionCount===0?
                <Text mt1 selfAlignCenter opacity050 text="( no selection )"/>
            :selectionCount===1?
                <Text mb1 h3 text={isTextEditable?'Text':item?.node.name}/>
            :
                <Text mt1 selfAlignCenter opacity050 text={`( ${selectionCount} items selected )`}/>
            }

            {item && comp && <MdxUiComponentMenuViewInternal
                key={item.id}
                comp={comp}
                builder={builder}
                item={item}
                foregroundColor={foregroundColor}
            />}

            {children}
        </div>
    )

}

const style=atDotCss({name:'MdxUiComponentMenuView',css:`
    @.root{
        display:flex;
        flex-direction:column;
    }



`});
