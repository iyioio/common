import { DataTableDescription, getDataTableShape, zodTypeToPrimitiveType } from "@iyio/common";
import * as cdk from 'aws-cdk-lib';
import * as db from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { ZodTypeAny } from "zod";

export interface TableBuilderProps
{
    tables:DataTableDescription[];
}

export interface TableInfo
{
    description:DataTableDescription;
    table:db.Table;
}

export class TableBuilder extends Construct
{
    public readonly tableInfo:TableInfo[];

    public constructor(scope:Construct, name:string, {
        tables
    }:TableBuilderProps)
    {

        super(scope,name);

        const tableInfo:TableInfo[]=[];


        for(const tbl of tables){


            const shape=getDataTableShape(tbl);

            const table=new db.Table(this,tbl.name+'Table',{
                tableClass:db.TableClass.STANDARD,
                billingMode:db.BillingMode.PAY_PER_REQUEST,
                partitionKey:{
                    name:tbl.primaryKey,
                    type:db.AttributeType.STRING,
                },
                sortKey:tbl.secondaryKey?{
                    name:tbl.secondaryKey,
                    type:db.AttributeType.STRING
                }:undefined,
                stream:tbl.watchable?db.StreamViewType.NEW_IMAGE:undefined,
                removalPolicy:cdk.RemovalPolicy.DESTROY,
                timeToLiveAttribute:tbl.ttlProp,

            });


            if(tbl.indexes?.length){
                if(!shape){
                    throw new Error(`TableBuilder requires table to define a scheme when using indexes. table:${tbl.name}`);
                }

                for(const index of tbl.indexes){
                    const shapeProp=shape[index.primary];
                    if(!shapeProp){
                        throw new Error(`No shape prop found in scheme of ${index.primary}`);
                    }
                    table.addGlobalSecondaryIndex({
                        indexName:`${index.name}-index`,
                        partitionKey:{
                            name:index.primary,
                            type:getDynamoType(shapeProp),
                        },
                        sortKey:index.sort?{
                            name:index.sort,
                            type:getDynamoType(shape[index.sort])
                        }:undefined,
                        projectionType:(
                            index.includeAll?
                                db.ProjectionType.ALL
                            :index.include?.length?
                                db.ProjectionType.INCLUDE
                            :
                                db.ProjectionType.KEYS_ONLY
                        ),
                        nonKeyAttributes:index.include?.length?index.include:undefined,

                    })
                }
            }

            // todo - watchable


            tableInfo.push({
                table,
                description:tbl
            })

        }

        this.tableInfo=tableInfo;
    }
}

const getDynamoType=(zodType:ZodTypeAny|undefined):db.AttributeType=>{

    if(!zodType){
        throw new Error('No zodType provided');
    }

    const tsType=zodTypeToPrimitiveType(zodType);

    if(!tsType){
        throw new Error(`No dynamo type maps to zodType`);
    }

    switch(tsType){
        case 'string': return db.AttributeType.STRING;

        case 'number': return db.AttributeType.NUMBER;

        default:
            throw new Error(`Can not map ts type ${tsType} to db.AttributeType`);
    }
}
