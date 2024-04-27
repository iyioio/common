import { aiCompleteConvoModule } from "@iyio/ai-complete";
import { openAiModule } from "@iyio/ai-complete-openai";
import { EnvParams, ScopeRegistration } from "@iyio/common";
import { nodeCommonModule } from "@iyio/node-common";

export const testModule=(scope:ScopeRegistration)=>{
    scope.addParams(new EnvParams());
    scope.use(nodeCommonModule);
    scope.use(openAiModule);
    scope.use(aiCompleteConvoModule);
}
