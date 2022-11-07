import { defineClient } from "@iyio/common";
import { S3Client } from "./S3Client";

export const s3Client=defineClient<S3Client>('s3Client',scope=>S3Client.fromScope(scope))
