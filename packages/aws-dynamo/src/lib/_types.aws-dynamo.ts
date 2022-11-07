import { defineService } from "@iyio/common";
import { DynamoClient } from "./DynamoClient";

export const dynamoClient=defineService<DynamoClient>('dynamoClient',scope=>DynamoClient.fromScope(scope))
