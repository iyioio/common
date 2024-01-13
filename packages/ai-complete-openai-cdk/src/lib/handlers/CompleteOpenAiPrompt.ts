import { AiCompletionRequest, AiCompletionRequestScheme, AiCompletionResult, AiCompletionResultScheme, aiComplete, aiCompleteModelCliam } from '@iyio/ai-complete';
import { FnEvent, UnauthorizedError, createFnHandler, shortUuid } from '@iyio/common';
import { initBackend } from "../ai-complete-openai-cdk-lib";
import { openAiAllowOpenAccessParam } from '../ai-complete-openai-cdk.deps';
import { checkTokenQuotaAsync, storeTokenUsageAsync } from '../price-capping';

initBackend();

const CompleteOpenAiPrompt=async (
    fnEvt:FnEvent,
    input:AiCompletionRequest
):Promise<AiCompletionResult>=>{

    const remoteAddress=fnEvt.remoteAddress||'0.0.0.0';

    if(!input.apiKey){
        const allow=await checkTokenQuotaAsync({remoteAddress});
        if(!allow){
            return {
                options:[{
                    message:{
                        id:shortUuid(),
                        type:'text',
                        role:'assistant',
                        content:'Token limit reached'
                    },
                    confidence:1,
                }]
            }
        }
    }

    const _modelsString=fnEvt.claims?.[aiCompleteModelCliam];
    if(!(typeof _modelsString === 'string') && !openAiAllowOpenAccessParam()){
        throw new UnauthorizedError();
    }

    const modelsString=(_modelsString as string)??'default';

    const r=await aiComplete().completeAsync(input,{
        allowedModels:modelsString.split(',').map(m=>m.trim())
    });

    if(!input.apiKey){
        await storeTokenUsageAsync(
            r.tokenPrice??1,
            {remoteAddress}
        )
    }

    return r;
}

export const handler=createFnHandler(CompleteOpenAiPrompt,{
    inputScheme:AiCompletionRequestScheme,
    outputScheme:AiCompletionResultScheme,
});

