import { AiComplationMessageType, AiCompletionFunctionCallError, AiCompletionMessage, AiCompletionOption, AiCompletionProvider, AiCompletionRequest, AiCompletionResult } from '@iyio/ai-complete';
import { FileBlob, Lock, Scope, SecretManager, asType, delayAsync, deleteUndefined, secretManager, shortUuid, unused } from '@iyio/common';
import { parse } from 'json5';
import OpenAIApi from 'openai';
import { ImagesResponse } from 'openai/resources';
import { ChatCompletionAssistantMessageParam, ChatCompletionCreateParams, ChatCompletionMessageParam, ChatCompletionSystemMessageParam, ChatCompletionTool, ChatCompletionUserMessageParam } from 'openai/resources/chat';
import { openAiApiKeyParam, openAiAudioModelParam, openAiBaseUrlParam, openAiChatModelParam, openAiImageModelParam, openAiSecretsParam } from './_types.ai-complete-openai';
import { OpenAiSecrets } from './ai-complete-openai-type';

const defaultTokenCharLength=3.75;
const maxImageGenAttempts=5;

export interface OpenAiCompletionProviderOptions
{
    apiKey?:string;
    apiBaseUrl?:string;
    chatModels?:string[];
    audioModels?:string[];
    imageModels?:string[];
    secretManager?:SecretManager;
    secretsName?:string;
}

//const dalle2Model='dall-e-2';
const dalle3Model='dall-e-3';

export class OpenAiCompletionProvider implements AiCompletionProvider
{

    public static fromScope(scope:Scope){
        return new OpenAiCompletionProvider({
            apiKey:scope.to(openAiApiKeyParam).get(),
            apiBaseUrl:scope.to(openAiBaseUrlParam).get(),
            secretManager:scope.to(secretManager).get(),
            secretsName:scope.to(openAiSecretsParam).get(),
            chatModels:scope.to(openAiChatModelParam).get()?.split(',').map(m=>m.trim()),
            audioModels:scope.to(openAiAudioModelParam).get()?.split(',').map(m=>m.trim()),
            imageModels:scope.to(openAiImageModelParam).get()?.split(',').map(m=>m.trim()),
        })
    }

    private readonly secretManager?:SecretManager;

    private readonly apiKey?:string;
    private readonly _apiBaseUrl?:string;

    private readonly secretsName?:string;

    private readonly _allowedModels:string[];

    private readonly _chatModel?:string;
    private readonly _audioModel?:string;
    private readonly _imageModel?:string;


    private readonly imageGenLockLow:Lock=new Lock(1)
    private readonly imageGenLock:Lock=new Lock(3);

    public constructor({
        apiKey,
        secretManager,
        secretsName,
        apiBaseUrl,
        chatModels=['gpt-3.5-turbo'],
        audioModels=['whisper-1'],
        imageModels=[dalle3Model],
    }:OpenAiCompletionProviderOptions){
        this.apiKey=apiKey;
        this._apiBaseUrl=apiBaseUrl,
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
                    baseURL:this._apiBaseUrl
                })
            })();
        }

        return await this.apiPromise;
    }

    public async completeAsync(lastMessage:AiCompletionMessage,request:AiCompletionRequest):Promise<AiCompletionResult>
    {

        switch(lastMessage.requestedResponseType??lastMessage.type){

            case 'text':
            case 'function':
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

        const oMsgs:ChatCompletionMessageParam[]=[];
        for(const m of request.messages){
            if(m.type==='text'){
                oMsgs.push(deleteUndefined(asType<ChatCompletionUserMessageParam|ChatCompletionAssistantMessageParam|ChatCompletionSystemMessageParam>({
                    role:(m.role??'user') as any,
                    content:m.content??'',
                })))
            }else if(m.type==='function' && m.called){
                const toolId=m.metadata?.['toolId']??m.called;
                oMsgs.push({
                    role:'assistant',
                    content:null,
                    tool_calls:[{
                        id:toolId,
                        type:'function',
                        function:{
                            name:m.called,
                            arguments:JSON.stringify(m.calledParams),
                        }
                    }]
                })
                if(m.calledReturn!==undefined){
                    oMsgs.push({
                        role:'tool',
                        tool_call_id:toolId,
                        content:JSON.stringify(m.calledReturn),
                    })
                }
            }
        }

        const oFns=request.functions?.map<ChatCompletionTool>(f=>{
            return {
                type:"function",
                function:deleteUndefined({
                    name:f.name,
                    description:f.description,
                    parameters:f.params??{}
                })
            }
        })

        const cParams:ChatCompletionCreateParams={
            model,
            stream:false,
            messages:oMsgs,
            tools:oFns?.length?oFns:undefined,
            user:lastMessage?.userId,
        };
        request.debug?.('snd > OpenAi.ChatCompletionCreateParams',cParams);

        const r=await api.chat.completions.create(cParams);

        request.debug?.('rec < OpenAi.ChatCompletionCreateParams',r);

        return {options:r.choices.map<AiCompletionOption>(c=>{

            let params:Record<string,any>|undefined;
            let callError:AiCompletionFunctionCallError|undefined;;

            const tool=c.message.tool_calls?.find(t=>t.function);
            const toolFn=tool?.function??c.message.function_call;
            let fnName:string|undefined=undefined;
            const toolId=(tool && toolFn)?tool.id:undefined;
            if(toolFn){
                try{

                    fnName=toolFn.name;
                    params=parse(toolFn.arguments??'{}');
                }catch(ex){
                    callError={
                        name:toolFn.name,
                        error:`Unable to parse arguments - ${(ex as any)?.message}\n${toolFn.arguments}`
                    }
                }
            }

            return {
                message:{
                    id:shortUuid(),
                    type:callError?'function-error':fnName?'function':'text',
                    role:c.message?.role,
                    content:c.message?.content??'',
                    call:(fnName && !callError)?{
                        name:fnName,
                        params:params??{}
                    }:undefined,
                    callError,
                    errorCausedById:callError?lastMessage.id:undefined,
                    isError:callError?true:undefined,
                    metadata:toolId?{toolId}:undefined,

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

        let r:ImagesResponse|undefined=undefined;

        for(let i=1;i<=maxImageGenAttempts;i++){
            try{
                const release=await (model===dalle3Model?this.imageGenLockLow:this.imageGenLock).waitAsync();
                try{
                    r=await api.images.generate({
                        prompt:lastMessage.content??'',
                        n:1,
                        size:model===dalle3Model?'1024x1024':'512x512',
                        user:lastMessage.userId,
                        model
                    });
                }finally{
                    release();
                }
                break;
            }catch(ex){
                if(i>=maxImageGenAttempts){
                    throw ex;
                }
                await delayAsync(i*1000+Math.round(1000*Math.random()));
            }
        }

        if(!r){
            throw new Error('Image not generated');
        }

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



    public getMaxTokensForMessageType?(messageType:AiComplationMessageType,model?:string):number|undefined
    {
        unused(messageType,model);
        // todo - check based on model
        return 4096;
    }

    public getTokenEstimateForMessage?(message:string,model?:string):number|undefined
    {
        unused(model);
        // todo - check based on model
        return message.length/defaultTokenCharLength;
    }

}
