import { endDateSort, safeParseDateOrUndefined, safeParseNumber } from "@iyio/common";
import { parseProtoExpression } from "./protogen-expression-lib";
import { protoGetChildrenByName } from "./protogen-node";
import { ProtoNode } from "./protogen-types";
import { ProtoAction, ProtoTimeWindow, ProtoTrigger } from "./protogen-workflow-types";

export const parseProtoAction=(node:ProtoNode):ProtoAction=>{
    const expression=parseProtoExpression({node,filterPaths:['trigger']});


    const workerAddresses:Record<string,string>={}
    const workerNodes=node.children?.['workers']?.children;
    if(workerNodes){
        for(const e in workerNodes){
            const worker=workerNodes[e];
            const address=worker.types[0]?.path
            if(address){
                workerAddresses[worker.name]=address.join('.');
            }
        }
    }
    const triggers=protoGetChildrenByName(node,'trigger',false);
    const windows=protoGetChildrenByName(node,'window',false);
    const order=node.children?.['order'];
    const maxWorkerExeCount=node.children?.['maxWorkerExeCount'];
    const maxGroupExeCount=node.children?.['maxGroupExeCount'];
    const condition=node.children?.['condition'];
    const exe=node.children?.['exe'];

    return {
        name:expression.name??'Action',
        workerAddresses: workerAddresses,
        order:order?safeParseNumber(node.children?.['order']?.value,0):endDateSort,
        maxWorkerExeCount:maxWorkerExeCount?safeParseNumber(node.children?.['maxWorkerExeCount']?.value,0):undefined,
        maxGroupExeCount:maxGroupExeCount?safeParseNumber(node.children?.['maxGroupExeCount']?.value,0):undefined,
        triggers:triggers.map(t=>parseProtoTrigger(t)),
        windows:windows.length?windows.map(t=>parseProtoTimeWindow(t)):undefined,
        condition:condition?parseProtoExpression({node:condition}):undefined,
        exe:exe?parseProtoExpression({node:exe}):undefined,


    }
}

export const parseProtoTrigger=(node:ProtoNode):ProtoTrigger=>{
    return {
        name:node.name??'trigger',
        address:node.types?.[0]?.type??'Event',
    }
}
export const parseProtoTimeWindow=(node:ProtoNode):ProtoTimeWindow=>{
    return {
        start:safeParseDateOrUndefined(node.children?.['start']?.value)?.getTime(),
        end:safeParseDateOrUndefined(node.children?.['end']?.value)?.getTime(),
    }
}
