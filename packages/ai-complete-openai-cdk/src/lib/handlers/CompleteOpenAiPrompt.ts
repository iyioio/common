import { AiCompletionRequest, AiCompletionRequestScheme, AiCompletionResult, AiCompletionResultScheme, aiComplete, aiCompleteModelCliam } from '@iyio/ai-complete';
import { FnEvent, UnauthorizedError, createFnHandler } from '@iyio/common';
import { initBackend } from "../ai-complete-openai-cdk-lib";

initBackend();

const CompleteOpenAiPrompt=async (
    fnEvt:FnEvent,
    input:AiCompletionRequest
):Promise<AiCompletionResult>=>{

    if(fnEvt.claims?.[aiCompleteModelCliam]!=='default'){
        throw new UnauthorizedError();
    }

    console.log('CompleteOpenAiPrompt',JSON.stringify(input,null,4)); // todo - remove

    return await aiComplete().completeAsync(input);
}

export const handler=createFnHandler(CompleteOpenAiPrompt,{
    inputScheme:AiCompletionRequestScheme,
    outputScheme:AiCompletionResultScheme,
});

