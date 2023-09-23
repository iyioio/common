import { AiCompletionFunctionCallError, AiCompletionMessage, AiCompletionOption, AiCompletionProvider, AiCompletionRequest, AiCompletionResult } from '@iyio/ai-complete';
import { FileBlob, Scope, SecretManager, deleteUndefined, secretManager, shortUuid } from '@iyio/common';
import { parse } from 'json5';
import OpenAIApi from 'openai';
import { openAiApiKeyParam, openAiAudioModelParam, openAiChatModelParam, openAiImageModelParam, openAiSecretsParam } from './_types.ai-complete-openai';
import { OpenAiSecrets } from './ai-complete-openai-type';

export interface OpenAiCompletionProviderOptions
{
    apiKey?:string;
    chatModels?:string[];
    audioModels?:string[];
    imageModels?:string[];
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
            chatModels:scope.to(openAiChatModelParam).get()?.split(',').map(m=>m.trim()),
            audioModels:scope.to(openAiAudioModelParam).get()?.split(',').map(m=>m.trim()),
            imageModels:scope.to(openAiImageModelParam).get()?.split(',').map(m=>m.trim()),
        })
    }

    private readonly secretManager?:SecretManager;

    private readonly apiKey?:string;

    private readonly secretsName?:string;

    private readonly _allowedModels:string[];

    private readonly _chatModel?:string;
    private readonly _audioModel?:string;
    private readonly _imageModel?:string;

    public constructor({
        apiKey,
        secretManager,
        secretsName,
        //model='gpt-4',
        chatModels=['gpt-3.5-turbo'],
        audioModels=['whisper-1'],
        imageModels=['dalle'],
    }:OpenAiCompletionProviderOptions){
        this.apiKey=apiKey;
        this.secretManager=secretManager;
        this.secretsName=secretsName;
        this._allowedModels=[...chatModels,...audioModels,...imageModels];
        this._chatModel=chatModels[0];
        this._audioModel=audioModels[0];
        this._imageModel=imageModels[0];
    }

    public getAllowedModels():readonly string[]{
        return this._allowedModels;
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

    public async completeAsync(lastMessage:AiCompletionMessage,request:AiCompletionRequest):Promise<AiCompletionResult>
    {

        switch(lastMessage.requestedResponseType??lastMessage.type){

            case 'text':
                return await this.completeChatAsync(lastMessage,request);

            case 'audio':
                return await this.completeAudioAsync(lastMessage);

            case 'image':
                return await this.completeImageAsync(lastMessage);

            default:
                return {options:[]}

        }
    }

    private async completeChatAsync(lastMessage:AiCompletionMessage,request:AiCompletionRequest):Promise<AiCompletionResult>
    {
        const model=lastMessage?.model??this._chatModel;
        if(!model){
            throw new Error('Chat AI model not defined');
        }

        const api=await this.getApiAsync();

        const r=await api.chat.completions.create({
            model,
            stream:false,
            messages:request.messages.filter(m=>m.type==='text').map((m)=>deleteUndefined({
                role:m.role??'user',
                content:m.content??'',
                name:m.name,
                user:lastMessage?.userId,
            })),
            functions:request.functions?.map(f=>{
                return deleteUndefined({
                    name:f.name,
                    description:f.description,
                    parameters:f.params??{}
                })
            })
        })

        return {options:r.choices.map<AiCompletionOption>(c=>{

            let params:Record<string,any>|undefined;
            let callError:AiCompletionFunctionCallError|undefined;;

            if(c.message.function_call?.arguments){
                try{
                    params=parse(c.message.function_call.arguments??'{}');
                }catch(ex){
                    callError={
                        name:c.message.function_call.name,
                        error:`Unable to parse arguments - ${(ex as any)?.message}\n${c.message.function_call.arguments}`
                    }
                }
            }

            return {
                message:{
                    id:shortUuid(),
                    type:callError?'function-error':c.message?.function_call?'function':'text',
                    role:c.message?.role,
                    content:c.message?.content??'',
                    call:(c.message?.function_call && !callError)?{
                        name:c.message.function_call.name??'',
                        params:params??{}
                    }:undefined,
                    callError,
                    errorCausedById:callError?lastMessage.id:undefined,
                    isError:callError?true:undefined,

                },
                confidence:1,
            }
        })};
    }

    private async completeAudioAsync(lastMessage:AiCompletionMessage):Promise<AiCompletionResult>
    {
        const model=lastMessage?.model??this._audioModel;
        if(!model){
            throw new Error('Audio AI model not defined');
        }

        const api=await this.getApiAsync();

        const type=lastMessage.dataContentType??'audio/mp3';

        const file=new FileBlob([Buffer.from(lastMessage.data??'','base64')],'audio.'+(type.split('/')[1]??'mp3'),{type});

        const r=await api.audio.transcriptions.create({
            file,
            model,
            prompt:lastMessage.content,
            response_format:'text',
        })

        const text=(typeof r === 'string')?r:r.text;

        return {options:[],preGeneration:[{
            id:shortUuid(),
            type:'text',
            role:lastMessage.role,
            content:text,
            replaceId:lastMessage.id,
        }]}
    }

    private async completeImageAsync(lastMessage:AiCompletionMessage):Promise<AiCompletionResult>
    {
        const model=lastMessage?.model??this._imageModel;
        if(!model){
            throw new Error('Image AI model not defined');
        }

        const api=await this.getApiAsync();

        const r=await api.images.generate({
            prompt:lastMessage.content??'',
            n:1,
            size:'512x512',
            user:lastMessage.userId,
        });

        return {options:[{
            message:{
                role:'assistant',
                id:shortUuid(),
                type:'image',
                url:r.data[0]?.url,
            },
            confidence:1,
        }]}
    }

}
