import os
from psycopg import sql, connect
from typing import Any, Dict
from .types import DocumentRetrievalRequest
from .retrieve import *
from iyio_common import exec_sql, escape_sql_identifier, parse_s3_path
import json
from sentence_transformers import SentenceTransformerEmbeddings
from langchain_community.vectorstores.pgvector import PGVector


def generate_document_list(request:DocumentRetrievalRequest):
    '''
    This function generates a list of relevant documents based on the provided request.

    Parameters:
    request (DocumentRetrievalRequest): The request object containing the prompt for which relevant documents are to be retrieved.

    Returns:
    document_list (list): A list of relevant documents retrieved based on the prompt in the request.
    '''

    COLLECTION_NAME = 'VectorIndex'
    CONNECTION_STRING = PGVector.connection_string_from_db_params(
     driver=os.environ.get("PGVECTOR_DRIVER", "psycopg2"),
     host=os.environ.get("PGVECTOR_HOST", "localhost"),
     port=int(os.environ.get("PGVECTOR_PORT", "5432")),
     database=os.environ.get("PGVECTOR_DATABASE", "postgres"),
     user=os.environ.get("PGVECTOR_USER", "postgres"),
     password=os.environ.get("PGVECTOR_PASSWORD", "postgres")
     )
    query = request.prompt
    embeddings = SentenceTransformerEmbeddings(model_path='../ai-models/all-mpnet-base-v2')

    vectordb = PGVector(
        collection_name=COLLECTION_NAME,
        connection_string=CONNECTION_STRING,
        embedding_function=embeddings,
    )
    retriever = vectordb.as_retriever()
    document_list = retriever.get_relevant_documents(query)

    return document_list



