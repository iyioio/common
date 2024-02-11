import boto3
from botocore.config import Config
import os
from typing import Any, Callable, List

client = None

def run_sqs(
    queueUrl:str,
    handler:Callable[[List[Any]],None],
    *,
    maxHandleCount:int=-1,
    maxMessageCount:int=1,
    # Max value 20, min value 0
    waitSeconds:int=20,
    # Max value 12hr
    visibilityTimeoutSeconds:int=30,
    exitOnFailure:bool=False,
    exitOnTimeout:bool=False
)->int:
    """ Dequeues messages from a SQS queue and calls the provided handler"""
    global client

    if not client:
        botoConfig = Config(
            region_name = os.getenv('AWS_REGION'),
        )
        client=boto3.client('sqs',config=botoConfig)


    handleCount=0

    while maxHandleCount<0 or handleCount<maxHandleCount:

        response=client.receive_message(
            QueueUrl=queueUrl,
            AttributeNames=[
                'SentTimestamp'
            ],
            MaxNumberOfMessages=maxMessageCount,
            MessageAttributeNames=[
                'All'
            ],
            VisibilityTimeout=visibilityTimeoutSeconds,
            WaitTimeSeconds=waitSeconds
        )

        if not response or not ('Messages' in response):
            if exitOnTimeout:
                break
            continue

        messages=response['Messages']

        if len(messages) == 0 and exitOnTimeout:
            break

        success=False

        try:
            handler(messages)
            handleCount=handleCount+len(messages)
            success=True
        except Exception as err:
            print('SQS handler failed',err)

        if success:
            client.delete_message_batch(
                QueueUrl=queueUrl,
                Entries=list(map((lambda m:({
                    'Id': m['MessageId'],
                    'ReceiptHandle': m['ReceiptHandle']
                })),messages))
            )
        elif exitOnFailure:
            break

    return handleCount
