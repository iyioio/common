import { ProviderTypeDef, Scope, TypeDef, UnauthorizedError, shortUuid } from "@iyio/common";
import { AiCompletionProviders } from "./_type.ai-complete";
import { aiCompleteDefaultModel, mergeAiCompletionMessages } from "./ai-complete-lib";
import { AiCompletionMessage, AiCompletionProvider, AiCompletionRequest, AiCompletionResult, CompletionOptions } from "./ai-complete-types";

export interface AiCompletionServiceOptions
{
    providers:ProviderTypeDef<AiCompletionProvider>;
}

export class AiCompletionService
{

    public static fromScope(scope:Scope){
        return new AiCompletionService({
            providers:scope.to(AiCompletionProviders),
        })
    }

    private readonly providers:TypeDef<AiCompletionProvider>;

    public constructor({
        providers
    }:AiCompletionServiceOptions){

        this.providers=providers;
    }

    private getProvider(lastMessage:AiCompletionMessage,request:AiCompletionRequest,options?:CompletionOptions):AiCompletionProvider|undefined{
        return this.providers.getFirst(null,p=>{
            if(p.canComplete?.(lastMessage,request,options)){
                return p;
            }else{
                return undefined;
            }
        }) ?? this.providers.getFirst(null,p=>{
            if(p.canComplete===undefined){
                return p;
            }else{
                return undefined;
            }
        })
    }

    public async completeAsync(request:AiCompletionRequest,options?:CompletionOptions):Promise<AiCompletionResult>
    {

        request={...request};
        request.messages=[...request.messages];

        let result:AiCompletionResult|null=null;
        let lastMessage=request.messages[request.messages.length-1];

        const mergeResult=(r:AiCompletionResult)=>{
            r.options.sort((a,b)=>b.confidence-a.confidence);
            if(result){
                if(!result.preGeneration){
                    result.preGeneration=[];
                }
                const prevOpt=result.options[0];
                if(prevOpt){
                    result.preGeneration.push(prevOpt.message);
                }
                if(r.preGeneration){
                    result.preGeneration.push(...r.preGeneration);
                    mergeAiCompletionMessages(r.preGeneration,request.messages);
                }
                result.options=r.options;
                if(!result.preGeneration.length){
                    delete result.preGeneration;
                }
            }else{
                result=r;
                if(r.preGeneration){
                    mergeAiCompletionMessages(r.preGeneration,request.messages);
                }
            }

            let lm=result.options[0]?.message;
            if(lm){
                request.messages.push(lm);
            }

            lm=request.messages[request.messages.length-1];
            if(lastMessage && lm && lm.id===lastMessage.id){
                lastMessage=undefined;
            }else{
                lastMessage=lm;
            }

        }

        const complete=async (msg:AiCompletionMessage)=>{
            const provider=this.getProvider(msg,request,options);
            if(!provider){
                return false;
            }

            if(msg.model){
                checkModelAccess(msg.model,provider,options);
            }

            try{
                mergeResult(await provider.completeAsync(msg,request,options));
                return true;
            }catch(ex){
                mergeResult({options:[{
                    confidence:1,
                    message:{
                        id:shortUuid(),
                        type:'error',
                        content:(ex as any)?.message,
                        errorCausedById:msg.id,
                        isError:true,
                    }
                }]})
                return false;
            }
        }

        if(lastMessage?.type==='audio'){
            const success=await complete(lastMessage);
            if(!success){
                return result??{options:[]}
            }
        }

        if(request.preGenerateOnly){
            return result??{options:[]}
        }

        if(lastMessage){
            const success=await complete(lastMessage);
            if(!success){
                return result??{options:[]}
            }
        }

        return result??{options:[]}
    }

}

const expandModels=(models:string[]|null|undefined,allowed:readonly string[]):readonly string[]=>{
    if(!models){
        return allowed;
    }

    if(models.includes(aiCompleteDefaultModel)){
        models=[...models];
        for(let i=0;i<models.length;i++){
            if(models[i]===aiCompleteDefaultModel){
                models.splice(i,1,...allowed);
                i+=allowed.length-1;
            }
        }
    }

    return models;
}

const checkModelAccess=(model:string,provider:AiCompletionProvider,options:CompletionOptions|undefined)=>{
    const allowed=provider.getAllowedModels?.()??[];
    const expanded=expandModels(options?.allowedModels,allowed);

    if(!allowed.includes(model) || !expanded.includes(model)){
        throw new UnauthorizedError(`User does not have access to model (${model})`);
    }
}
