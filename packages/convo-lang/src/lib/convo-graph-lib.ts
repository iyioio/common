import { ZodType } from "zod";
import { Conversation, ConversationOptions } from "./Conversation";
import { ConvoMetadataAndTypeMap, ConvoNode, ConvoNodeExecCtx, ConvoNodeMetadata, ConvoNodeOutput } from "./convo-graph-types";
import { convoTags } from "./convo-lib";

export const getConvoNodeMetadataAsync=async (convo:Conversation|null):Promise<ConvoMetadataAndTypeMap>=>{

    const outputTypes:ConvoNodeOutput[]=[];
    const metadata:ConvoNodeMetadata={outputTypes}
    const typeMap:Record<string,ZodType<any>>={}

    if(!convo){
        return {metadata,typeMap};
    }

    const flat=await convo.getLastAutoFlatAsync();

    if(!flat){
        return {metadata,typeMap}
    }

    const inputVar=flat.exe.getVarAsType('Input');

    if(inputVar){
        metadata.inputType={name:'Input'}
        typeMap['Input']=inputVar;
    }


    for(const msg of flat.messages){
        if( msg.tags &&
            (convoTags.output in msg.tags) &&
            msg.fn?.returnType
        ){
            const outputVar=flat.exe.getVarAsType(msg.fn.returnType);
            if(outputVar){
                const output:ConvoNodeOutput={
                    name:msg.fn.returnType,
                    fnName:msg.fn.name,
                }
                outputTypes.push(output);
            }
        }
    }

    if(!outputTypes.length && inputVar){
        outputTypes.push({
            name:'Input'
        })
    }

    return {metadata,typeMap}
}

export const createConvoNodeExecCtxAsync=async (node:ConvoNode,convoOptions?:ConversationOptions):Promise<ConvoNodeExecCtx>=>{

    const defaultVars={
        ...convoOptions?.defaultVars
    }

    const last=(node.sharedConvo || node.steps.length)?new Conversation({
        ...convoOptions,
        defaultVars,
        initConvo:(node.sharedConvo?node.sharedConvo+'\n\n':'')+(node.steps[node.steps.length-1]?.convo??'')
    }):null;



    const metadataAndMap=await getConvoNodeMetadataAsync(last);

    return {
        ...metadataAndMap,
        defaultVars,
        steps:node.steps.map((step,i)=>({
            nodeStep:step,
            convo:(i===node.steps.length-1 && last)?last:new Conversation({
                ...convoOptions,
                defaultVars,
                initConvo:(node.sharedConvo?node.sharedConvo+'\n\n':'')+step.convo
            })
        }))
    }
}
