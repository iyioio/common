import boto3
import os
from botocore.config import Config
from .env import getEnvVar
import psycopg2

rdsClient = None

debug_sql=False

def exec_sql(sql:str, dryRun:bool):
    if getEnvVar('NX_RDS_CLUSTER_ARN'):
        return exec_sql_rds(sql,dryRun)
    else:
        return exec_sql_pg(sql,dryRun)

def exec_sql_rds(sql:str, dryRun:bool):
    global rdsClient

    if not rdsClient:
        if debug_sql:
            print('Creating boto rds-data client')
        botoConfig = Config(
            region_name = getEnvVar('AWS_REGION'),
        )
        rdsClient=boto3.client('rds-data',config=botoConfig)


    if debug_sql:
        print(f'execute_statement - {sql}')

    if dryRun:
        print(f'sql exec dry run - {sql}')
    else:
        rdsClient.execute_statement(
            resourceArn=getEnvVar('NX_RDS_CLUSTER_ARN'),
            secretArn=getEnvVar('NX_RDS_SECRET_ARN'),
            database=getEnvVar('NX_RDS_DATABASE'),
            sql=sql,
        )


pgConn=None

def exec_sql_pg(sql:str, dryRun:bool):
    global pgConn

    if not pgConn:
        pgConn=psycopg2.connect(
            database=getEnvVar('PGDATABASE'),
            host=getEnvVar('PGHOST'),
            user=getEnvVar('PGUSER'),
            password=getEnvVar('PGPASSWORD'),
            port=getEnvVar('PGPORT'),
        )

    cur=pgConn.cursor()


    if debug_sql:
        print(f'execute_statement - {sql}')

    if dryRun:
        print(f'sql exec dry run - {sql}')
    else:
        cur.execute(sql)
        pgConn.commit()
        cur.close()
