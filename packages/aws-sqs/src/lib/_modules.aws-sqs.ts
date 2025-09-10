import { ScopeRegistration, queueClientProviders } from "@iyio/common";
import { SqsQueueClient } from "./SqsQueueClient.js";

export const awsSqsModule=(reg:ScopeRegistration)=>{
    reg.addProvider(queueClientProviders,scope=>SqsQueueClient.fromScope(scope));
}
