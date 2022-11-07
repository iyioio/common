import { defineService } from "@iyio/common";
import { S3Client } from "./S3Client";

export const s3Client=defineService<S3Client>('s3Client',scope=>S3Client.fromScope(scope))
