import { defineClient } from "@iyio/common";
import { RdsClient } from "./RdsClient";

export const rdsClient=defineClient<RdsClient>('rdsClient',scope=>RdsClient.fromScope(scope));
