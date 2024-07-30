import { IEventDestination } from '@iyio/common';
import { ProtoNode, protoChildrenToStringRecordOrUndefined, protoGetChildrenByNameOrUndefined } from "@iyio/protogen";

export const parseProtoEventDestinations=(node:ProtoNode):IEventDestination[]|undefined=>{
    const onNodes=protoGetChildrenByNameOrUndefined(node,'on',false);

    if(!onNodes?.length){
        return undefined;
    }

    const ary:IEventDestination[]=[];

    for(const n of onNodes){
        if(!n.children){
            continue;
        }
        for(const eventType in n.children){

            const child=n.children[eventType];
            if(!child){
                continue;
            }

            const targets=child.types.filter(t=>t.isRefType);
            for(const target of targets){
                ary.push({
                    targetName:target.type,
                    type:eventType,
                    props:protoChildrenToStringRecordOrUndefined(child.children)
                })
            }

        }
    }

    return ary.length?ary:undefined;
}
