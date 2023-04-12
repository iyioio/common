
import * as db from "aws-cdk-lib/aws-dynamodb";

export const getDynamoDbGlobalSecondaryIndexNames=(dynamoTable: db.ITable):string[]=>{
    const table=dynamoTable.node.defaultChild as db.CfnTable;
    const indexes=dynamoTable.stack.resolve(table.globalSecondaryIndexes) as
        db.CfnTable.GlobalSecondaryIndexProperty[]|undefined;
    const indexNames:string[]=[];
    if(indexes){
        for(const index of indexes) {
            indexNames.push(index.indexName);
        }
    }
    return indexNames;
}

export const getDynamoDbLocalSecondaryIndexNames=(dynamoTable: db.ITable):string[]=>{
    const table=dynamoTable.node.defaultChild as db.CfnTable;
    const indexes=dynamoTable.stack.resolve(table.localSecondaryIndexes) as
        db.CfnTable.LocalSecondaryIndexProperty[]|undefined;
    const indexNames:string[]=[];
    if(indexes){
        for(const index of indexes) {
            indexNames.push(index.indexName);
        }
    }
    return indexNames;
}
