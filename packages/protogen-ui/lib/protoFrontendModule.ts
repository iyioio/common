import { AiCompletionProviders, HttpAiCompletionProvider } from "@convo-lang/ai-complete";
import { ScopeRegistration, isServerSide } from "@iyio/common";

export const protoFrontendModule=(reg:ScopeRegistration)=>{

    if(isServerSide){
        return;
    }

    reg.addProvider(AiCompletionProviders,scope=>HttpAiCompletionProvider.fromScope(scope));

}
