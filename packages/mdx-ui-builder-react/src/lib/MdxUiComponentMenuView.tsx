import { AcCompRegistry } from "@iyio/any-comp";
import { MdxUiBuilder, MdxUiSelectionItem } from "@iyio/mdx-ui-builder";
import { useSubject } from "@iyio/react-common";
import { MdxUiComponentMenuViewInternal } from "./MdxUiComponentMenuViewInternal";

export interface MdxUiComponentMenuViewProps
{
    compReg?:AcCompRegistry;
    item?:MdxUiSelectionItem;
    builder:MdxUiBuilder;
    useSelectedItem?:boolean;
    foregroundColor?:string;
}

export function MdxUiComponentMenuView({
    compReg,
    item:itemProp,
    builder,
    useSelectedItem,
    foregroundColor,
}:MdxUiComponentMenuViewProps){

    const selection=useSubject(useSelectedItem?builder.selectionSubject:undefined);

    const item=useSelectedItem?(selection?.all.length===1?selection.item:undefined):itemProp;

    const compType=item?.componentType;
    const comp=compType?compReg?.comps.find(c=>c.name===item?.componentType):undefined;

    if(!comp || !item){
        return null;
    }

    return (
        <MdxUiComponentMenuViewInternal
            key={item.id}
            comp={comp}
            builder={builder}
            item={item}
            foregroundColor={foregroundColor}

        />
    )

}
