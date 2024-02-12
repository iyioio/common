from psycopg import sql, connect
from typing import Any, Dict
from .types import DocumentRetrievalRequest
from .embed import encode_text
from iyio_common import exec_sql, escape_sql_identifier, parse_s3_path
import json
from sentence_transformers import SentenceTransformerEmbeddings
import os
from langchain_community.vectorstores.pgvector import PGVector

embeddings_table='VectorIndex'

def generate_document_list(request:DocumentRetrievalRequest):

    document_path=request.location
    content_type=request.contentType
    COLLECTION_NAME = embeddings_table

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



