import boto3
import os
from botocore.config import Config

client = None

debug_sql=True

def exec_sql(sql:str, dryRun:bool):
    global client

    if not client:
        if debug_sql:
            print('Creating boto rds-data client')
        botoConfig = Config(
            region_name = os.getenv('AWS_REGION'),
        )
        client=boto3.client('rds-data',config=botoConfig)


    if debug_sql:
        print(f'execute_statement - {sql}')

    if not dryRun:
        client.execute_statement(
            resourceArn=os.getenv('NX_RDS_CLUSTER_ARN'),
            secretArn=os.getenv('NX_RDS_SECRET_ARN'),
            database=os.getenv('NX_RDS_DATABASE'),
            sql=sql,
        )
