import { QueueService } from "./QueueService.js";
import { IQueueClient } from "./queue-types.js";
import { defineProvider, defineService } from "./scope-lib.js";

export const queueClientProviders=defineProvider<IQueueClient>('queueClientProviders');

export const queueService=defineService<QueueService>('queueService',scope=>QueueService.fromScope(scope))
