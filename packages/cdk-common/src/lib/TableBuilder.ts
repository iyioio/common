import { DataTableDescription, getDataTableShape, ParamTypeDef, zodTypeToPrimitiveType } from "@iyio/common";
import * as cdk from 'aws-cdk-lib';
import * as db from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { ZodTypeAny } from "zod";
import { grantTableQueryPerms, grantTableScanPerms, isCdkEnvPatternMatch } from "./cdk-lib.js";
import { AccessGranter, IAccessGrantGroup } from "./cdk-types.js";
import { getDefaultManagedProps, ManagedProps } from "./ManagedProps.js";

export interface TableBuilderProps
{
    tables:TableInfo[];
    managed?:ManagedProps;
}

export interface TableInfo
{
    tableDescription:DataTableDescription;
    arnParam?:ParamTypeDef<string>;
    grantAccess?:boolean;

    /**
     * An environment pattern that can be used to disable a table
     */
    envPattern?:string;
}

export interface TableInfoAndTable
{
    description:DataTableDescription;
    table:db.Table;
}

export class TableBuilder extends Construct implements IAccessGrantGroup
{
    public readonly tableInfo:TableInfoAndTable[];

    public readonly accessGrants:AccessGranter[]=[];

    public constructor(scope:Construct, name:string, {
        tables,
        managed:{
            params,
            accessManager,
            resources
        }=getDefaultManagedProps(),
    }:TableBuilderProps)
    {

        super(scope,name);

        const tableInfo:TableInfoAndTable[]=[];


        for(const info of tables){

            if(!isCdkEnvPatternMatch(info.envPattern)){
                continue;
            }

            const tbl=info.tableDescription;

            const shape=getDataTableShape(tbl);

            const table=new db.Table(this,tbl.name+'Table',{
                tableClass:db.TableClass.STANDARD,
                billingMode:db.BillingMode.PAY_PER_REQUEST,
                partitionKey:{
                    name:tbl.primaryKey,
                    type:db.AttributeType.STRING,
                },
                sortKey:tbl.sortKey?{
                    name:tbl.sortKey,
                    type:tbl.sortKeyType==='number'?db.AttributeType.NUMBER:db.AttributeType.STRING
                }:undefined,
                stream:tbl.watchable?db.StreamViewType.NEW_IMAGE:undefined,
                removalPolicy:cdk.RemovalPolicy.DESTROY,
                timeToLiveAttribute:tbl.ttlProp,
            });

            resources.push({name:tbl.name,table});

            if(info.arnParam && params){
                params.setParam(info.arnParam,table.tableArn);
            }


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
                        indexName:index.name,
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

            if(info.grantAccess){
                this.accessGrants.push({
                    grantName:tbl.name,
                    grant:request=>{
                        if(request.types?.includes('read')){
                            table.grantReadData(request.grantee);
                            grantTableQueryPerms(request.grantee,table);
                        }
                        if(request.types?.includes('scan')){
                            grantTableScanPerms(request.grantee,table);
                        }
                        if(request.types?.includes('write')){
                            table.grantWriteData(request.grantee);
                        }
                    }
                })
            }

            // todo - watchable


            tableInfo.push({
                table,
                description:tbl
            })

        }

        this.tableInfo=tableInfo;

        accessManager?.addGroup(this);
    }
}

const getDynamoType=(zodType:ZodTypeAny|undefined):db.AttributeType=>{

    if(!zodType){
        throw new Error('No zodType provided');
    }

    const tsType=zodTypeToPrimitiveType(zodType);

    if(!tsType){

        throw new Error(`No dynamo type maps to zodType - ${zodType._def?.typeName}`);
    }

    switch(tsType){
        case 'string': return db.AttributeType.STRING;

        case 'number': return db.AttributeType.NUMBER;

        default:
            throw new Error(`Can not map ts type ${tsType} to db.AttributeType`);
    }
}
