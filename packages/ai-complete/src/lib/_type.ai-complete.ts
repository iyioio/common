import { defineProvider, defineService, defineStringParam } from "@iyio/common";
import { AiCompletionService } from "./ai-complete-lib";
import { AiCompletionProvider } from "./ai-complete-types";

export const AiCompletionProviders=defineProvider<AiCompletionProvider>("AiCompletionProviders");

export const aiComplete=defineService('aiComplete',scope=>AiCompletionService.fromScope(scope));

export const httpAiCompletionUrlParam=defineStringParam('httpAiCompletionUrl','/api/complete');

export const aiCompletionFnArnParam=defineStringParam('aiCompletionFnArn');
