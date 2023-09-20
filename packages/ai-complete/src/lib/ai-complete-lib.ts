import { ProviderTypeDef, Scope, TypeDef } from "@iyio/common";
import { AiCompletionProviders } from "./_type.ai-complete";
import { AiCompletionProvider, AiCompletionRequest, AiCompletionResult, CompletionOptions } from "./ai-complete-types";

export const aiCompleteModelCliam='aiCompleteModel';

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

    private getProvider(request:AiCompletionRequest,options?:CompletionOptions):AiCompletionProvider|undefined{
        return this.providers.getFirst(null,p=>{
            if(p.canComplete?.(request,options)){
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
        const provider=this.getProvider(request,options);
        if(!provider){
            return {
                options:[]
            }
        }

        return await provider.completeAsync(request,options);
    }
}
