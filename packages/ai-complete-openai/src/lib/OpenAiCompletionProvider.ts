import { AiCompletionOption, AiCompletionProvider, AiCompletionRequest, AiCompletionResult, CompletionOptions } from '@iyio/ai-complete';
import { Scope, SecretManager, UnauthorizedError, deleteUndefined, secretManager } from '@iyio/common';
import { parse } from 'json5';
import OpenAIApi from 'openai';
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
        //model='gpt-4',
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
                return new OpenAIApi({
                    apiKey,
                    dangerouslyAllowBrowser:true,
                })
            })();
        }

        return await this.apiPromise;
    }

    public async completeAsync(request:AiCompletionRequest,{
        allowedModels=[this.model]
    }:CompletionOptions={}):Promise<AiCompletionResult>
    {
        allowedModels=allowedModels.map(m=>m==='default'?this.model:m);

        const model=request.model??this.model;

        if(!allowedModels.includes(model)){
            throw new UnauthorizedError(`Requested model (${model}) is not allowed to be used`);
        }

        const api=await this.getApiAsync();

        const lastMsg=request.prompt[request.prompt.length-1];
        if(lastMsg?.requestedResponseType==='image'){
            const r=await api.images.generate({
                prompt:lastMsg.content??'',
                n:1,
                size:'512x512'
            });

            return {
                options:[{
                    message:{
                        type:'image',
                        url:r.data[0]?.url,
                    },
                    confidence:1,
                }]
            }
        }else{

            const r=await api.chat.completions.create({
                model,
                stream:false,
                messages:request.prompt.filter(m=>m.type==='text').map((m,i)=>deleteUndefined({
                    role:m.role??(i===0?'system':'user'),
                    content:m.content??'',
                    name:m.name
                })),
                functions:request.functions?.map(f=>{
                    return deleteUndefined({
                        name:f.name,
                        description:f.description,
                        parameters:f.params??{}
                    })
                })
            })

            return {
                options:r.choices.map<AiCompletionOption>(c=>({
                    message:{
                        type:'text',
                        role:c.message?.role,
                        content:c.message?.content??'',
                        call:c.message?.function_call?{
                            name:c.message.function_call.name??'',
                            params:parse(c.message.function_call.arguments??'{}')
                        }:undefined

                    },
                    confidence:1,
                })),
                providerData:request.returnProviderData?r:undefined
            }
        }
    }

}
