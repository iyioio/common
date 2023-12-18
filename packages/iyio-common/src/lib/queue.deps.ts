import { QueueService } from "./QueueService";
import { IQueueClient } from "./queue-types";
import { defineProvider, defineService } from "./scope-lib";

export const queueClientProviders=defineProvider<IQueueClient>('queueClientProviders');

export const queueService=defineService<QueueService>('queueService',scope=>QueueService.fromScope(scope))
