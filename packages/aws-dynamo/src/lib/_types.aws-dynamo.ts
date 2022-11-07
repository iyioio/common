import { defineClient } from "@iyio/common";
import { DynamoClient } from "./DynamoClient";

export const dynamoClient=defineClient<DynamoClient>('dynamoClient',scope=>DynamoClient.fromScope(scope))
