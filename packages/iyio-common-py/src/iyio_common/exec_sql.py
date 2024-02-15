import boto3
import os
from botocore.config import Config
from .env import getEnvVar

client = None

debug_sql=False

def exec_sql(sql:str, dryRun:bool):
    global client

    if not client:
        if debug_sql:
            print('Creating boto rds-data client')
        botoConfig = Config(
            region_name = getEnvVar('AWS_REGION'),
        )
        client=boto3.client('rds-data',config=botoConfig)


    if debug_sql:
        print(f'execute_statement - {sql}')

    if dryRun:
        print(f'sql exec dry run - {sql}')
    else:
        client.execute_statement(
            resourceArn=getEnvVar('NX_RDS_CLUSTER_ARN'),
            secretArn=getEnvVar('NX_RDS_SECRET_ARN'),
            database=getEnvVar('NX_RDS_DATABASE'),
            sql=sql,
        )
