import { AiCompletionRequest, AiCompletionRequestScheme, AiCompletionResult, AiCompletionResultScheme, aiComplete, aiCompleteModelCliam } from '@iyio/ai-complete';
import { FnEvent, UnauthorizedError, createFnHandler } from '@iyio/common';
import { initBackend } from "../ai-complete-openai-cdk-lib";

initBackend();

const CompleteOpenAiPrompt=async (
    fnEvt:FnEvent,
    input:AiCompletionRequest
):Promise<AiCompletionResult>=>{

    const modelsString=fnEvt.claims?.[aiCompleteModelCliam];
    if(!(typeof modelsString === 'string')){
        throw new UnauthorizedError();
    }

    console.log('CompleteOpenAiPrompt - ',JSON.stringify(input,null,4)); // todo - remove

    return await aiComplete().completeAsync(input,{
        allowedModels:modelsString.split(',').map(m=>m.trim())
    });
}

export const handler=createFnHandler(CompleteOpenAiPrompt,{
    inputScheme:AiCompletionRequestScheme,
    outputScheme:AiCompletionResultScheme,
});

