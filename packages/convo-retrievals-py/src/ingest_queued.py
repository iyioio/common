from typing import Any, List
from iyio_common import run_sqs
import os

queueUrl=os.getenv('CONNECTED_QUEUE_URL')
if not queueUrl:
    print('CONNECTED_QUEUE_URL env var required')
    raise


def onMessage(messages:List[Any]):
    print('New messages',messages)


# receive first message from queue then exit
run_sqs(queueUrl,onMessage,exitOnFailure=True,exitOnTimeout=True)
