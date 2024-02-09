from src.convo_embeddings import request_handler
from iyio_common import start_rest_server
import os

serverPort=int(os.getenv('REST_PORT') or os.getenv('PORT') or '8080')

start_rest_server(serverPort,request_handler)
