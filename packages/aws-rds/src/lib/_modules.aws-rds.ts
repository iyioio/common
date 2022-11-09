import { ScopeRegistration, sqlClient } from "@iyio/common";
import { RdsClient } from "./RdsClient";

export const awsRdsModule=(sr:ScopeRegistration)=>{
    sr.implementClient(sqlClient,scope=>RdsClient.fromScope(scope));
}
