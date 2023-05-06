import { AiCompletionOption, AiCompletionProvider, AiCompletionRequest, AiCompletionResult } from '@iyio/ai-complete';
import { Scope, deleteUndefined } from '@iyio/common';
import { Configuration, OpenAIApi } from 'openai';
import { openAiApiKeyParam } from './_types.ai-complete-openai';

export interface OpenAiCompletionProviderOptions
{
    apiKey:string;
    model?:string;
}

export class OpenAiCompletionProvider implements AiCompletionProvider
{

    public static fromScope(scope:Scope){
        return new OpenAiCompletionProvider({
            apiKey:openAiApiKeyParam(scope)
        })
    }

    private readonly api:OpenAIApi;

    public readonly model:string;

    public constructor({
        apiKey,
        model='gpt-3.5-turbo',
    }:OpenAiCompletionProviderOptions){

        this.api=new OpenAIApi(new Configuration({
            apiKey
        }))
        this.model=model;
    }

    public async completeAsync(request: AiCompletionRequest):Promise<AiCompletionResult>
    {
        const r=await this.api.createChatCompletion({
            model:this.model,
            stream:false,
            messages:request.prompt.map((m,i)=>deleteUndefined({
                role:m.role??(i===0?'system':'user'),
                content:m.content,
                name:m.name
            }))
        })

        return {
            options:r.data.choices.map<AiCompletionOption>(c=>({
                message:{
                    role:c.message?.role,
                    content:c.message?.content??''
                },
                contentType:'text/plain',
                confidence:1,
            })),
            providerData:{
                data:r.data,
                status:r.status,
                statusText:r.statusText,
            }
        }
    }

}
