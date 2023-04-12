import * as iam from "aws-cdk-lib/aws-iam";

export type Grantee = iam.IGrantable & {
    addToRolePolicy?(statement:iam.PolicyStatement):void;
    addToPolicy?(statement:iam.PolicyStatement):void;
}
