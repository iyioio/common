import { ScopeRegistration, queueClientProviders } from "@iyio/common";
import { SqsQueueClient } from "./SqsQueueClient";

export const awsSqsModule=(reg:ScopeRegistration)=>{
    reg.addProvider(queueClientProviders,scope=>SqsQueueClient.fromScope(scope));
}
