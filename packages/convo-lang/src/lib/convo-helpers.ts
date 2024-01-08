import { Conversation, ConversationOptions } from "./Conversation";
import { ConvoCompletion, ConvoCompletionOptions } from "./convo-types";

export const getConvoCompletionAsync=(
    messagesOrOptions:string|ConvoCompletionOptions,
    conversationOptions:ConversationOptions
):Promise<ConvoCompletion>=>{
    const conversation=new Conversation(conversationOptions);
    return conversation.completeAsync(messagesOrOptions);
}

export const getConvoJsonCompletionAsync=async (
    messagesOrOptions:string|ConvoCompletionOptions,
    conversationOptions:ConversationOptions
):Promise<any>=>{
    const c=await getConvoCompletionAsync(messagesOrOptions,conversationOptions);

    if(c.message?.content===undefined){
        return undefined;
    }

    try{
        return JSON.parse(c.message.content);
    }catch{
        return undefined;
    }
}

export const callConvoFunctionAsync=async (
    messagesOrOptions:string|ConvoCompletionOptions,
    conversationOptions:ConversationOptions
):Promise<any>=>{

    const c=await getConvoCompletionAsync(messagesOrOptions,conversationOptions);

    return c.message?.callParams;
}
