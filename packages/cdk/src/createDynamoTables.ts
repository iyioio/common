import { testDynamoDbTableParam, testDynamoDbTableWithSecondaryIndexesParam, testDynamoDbTableWithSortKeyParam } from '@iyio/aws-dynamo';
import * as cdk from "aws-cdk-lib";
import * as db from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export const createDynamoTables=(scope:Construct, role:iam.Role)=>{

    const defaultTable = new db.Table(scope, "defaultTable", {
        partitionKey:{
            name:"id",
            type:db.AttributeType.STRING,
        },
        tableClass:db.TableClass.STANDARD,
        billingMode:db.BillingMode.PAY_PER_REQUEST,
    });
    grantTablePerms(role,defaultTable);
    new cdk.CfnOutput(scope,testDynamoDbTableParam.typeName+'Param',{value:defaultTable.tableName});


    const sortKeyTable = new db.Table(scope, "sortKeyTable", {
        partitionKey:{
            name:"id",
            type:db.AttributeType.STRING,
        },
        sortKey:{
            name:"sub",
            type:db.AttributeType.STRING
        },
        tableClass:db.TableClass.STANDARD,
        billingMode:db.BillingMode.PAY_PER_REQUEST,
    });
    grantTablePerms(role,defaultTable);
    new cdk.CfnOutput(scope,testDynamoDbTableWithSortKeyParam.typeName+'Param',{value:sortKeyTable.tableName});

    const secondaryTable = new db.Table(scope, "secondaryTable", {
        partitionKey:{
            name:"id",
            type:db.AttributeType.STRING,
        },
        tableClass:db.TableClass.STANDARD,
        billingMode:db.BillingMode.PAY_PER_REQUEST,
    });
    grantTablePerms(role,defaultTable);
    new cdk.CfnOutput(scope,testDynamoDbTableWithSecondaryIndexesParam.typeName+'Param',{value:secondaryTable.tableName});

    return {defaultTable,sortKeyTable}

}

const grantTablePerms=(grantee:Grantee, table:db.Table)=>{
    table.grantReadWriteData(grantee);
    const getPolicy=()=>new iam.PolicyStatement({
        actions:["dynamodb:Query"],
        resources:[`${table.tableArn}/index/*`],
    })
    grantee.addToRolePolicy?.(getPolicy());
    grantee.addToPolicy?.(getPolicy());
}

type Grantee = iam.IGrantable & {
    addToRolePolicy?(statement:iam.PolicyStatement):void;
    addToPolicy?(statement:iam.PolicyStatement):void;
}
