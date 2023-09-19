import { AiCompletionOption, AiCompletionProvider, AiCompletionRequest, AiCompletionResult } from '@iyio/ai-complete';
import { Scope, SecretManager, deleteUndefined, secretManager } from '@iyio/common';
import { parse } from 'jsonc-parser';
import { Configuration, OpenAIApi } from 'openai';
import { openAiApiKeyParam, openAiModelParam, openAiSecretsParam } from './_types.ai-complete-openai';
import { OpenAiSecrets } from './ai-complete-openai-type';

export interface OpenAiCompletionProviderOptions
{
    apiKey?:string;
    model?:string;
    secretManager?:SecretManager;
    secretsName?:string;
}

export class OpenAiCompletionProvider implements AiCompletionProvider
{

    public static fromScope(scope:Scope){
        return new OpenAiCompletionProvider({
            apiKey:scope.to(openAiApiKeyParam).get(),
            secretManager:scope.to(secretManager).get(),
            secretsName:scope.to(openAiSecretsParam).get(),
            model:scope.to(openAiModelParam).get(),
        })
    }

    private readonly secretManager?:SecretManager;

    private readonly apiKey?:string;

    private readonly secretsName?:string;

    public readonly model:string;

    public constructor({
        apiKey,
        secretManager,
        secretsName,
        model='gpt-3.5-turbo',
    }:OpenAiCompletionProviderOptions){
        this.apiKey=apiKey;
        this.secretManager=secretManager;
        this.secretsName=secretsName;
        this.model=model;
    }

    private apiPromise:Promise<OpenAIApi>|null=null;
    private async getApiAsync()
    {
        if(!this.apiPromise){
            this.apiPromise=(async ()=>{
                let apiKey=this.apiKey;
                if(!apiKey && this.secretManager && this.secretsName){
                    const {apiKey:key}=await this.secretManager.requireSecretTAsync<OpenAiSecrets>(this.secretsName,true);
                    apiKey=key;
                }
                if(!apiKey){
                    throw new Error('Unable to get OpenAi apiKey');
                }
                return new OpenAIApi(new Configuration({
                    apiKey
                }))
            })();
        }

        return await this.apiPromise;
    }

    public async completeAsync(request: AiCompletionRequest):Promise<AiCompletionResult>
    {
        const api=await this.getApiAsync();

        const r=await api.createChatCompletion({
            model:this.model,
            stream:false,
            messages:request.prompt.map((m,i)=>deleteUndefined({
                role:m.role??(i===0?'system':'user'),
                content:m.content,
                name:m.name
            })),
            functions:request.functions?.map(f=>{
                return deleteUndefined({
                    name:f.name,
                    description:f.description,
                    parameters:f.params
                })
            })
        })

        return {
            options:r.data.choices.map<AiCompletionOption>(c=>({
                message:{
                    role:c.message?.role,
                    content:c.message?.content??'',
                    call:c.message?.function_call?{
                        name:c.message.function_call.name??'',
                        params:parse(c.message.function_call.arguments??'{}')
                    }:undefined

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
