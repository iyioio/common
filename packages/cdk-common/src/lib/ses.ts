import { Stack } from "aws-cdk-lib";
import * as iam from 'aws-cdk-lib/aws-iam';
import { FunctionBase } from "aws-cdk-lib/aws-lambda";

export const grantSendEmail=(stack:Stack,fn:FunctionBase)=>{
    fn.addToRolePolicy(
        new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:SendTemplatedEmail",
            ],
            resources: [
                `arn:aws:ses:${stack.region}:${stack.account}:identity/*`,
            ],
        })
    );
}
