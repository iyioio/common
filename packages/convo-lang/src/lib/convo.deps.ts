import { defineService, defineStringParam } from "@iyio/common";
import { ConvoCompletionService } from "./convo-types";

export const convoCompletionService=defineService<ConvoCompletionService>('ConvoCompletionService');

export const convoCapabilitiesParams=defineStringParam('convoCapabilities');
