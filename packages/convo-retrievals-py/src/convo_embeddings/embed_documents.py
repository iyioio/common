from langchain_community.document_loaders import S3FileLoader, UnstructuredURLLoader, UnstructuredFileLoader, UnstructuredHTMLLoader, UnstructuredPDFLoader, UnstructuredMarkdownLoader, DirectoryLoader
from langchain.text_splitter import CharacterTextSplitter
from psycopg import sql, connect
from typing import Any, Dict
from .types import DocumentEmbeddingRequest
from .embed import encode_text
from iyio_common import exec_sql, escape_sql_identifier, parse_s3_path
import json


embeddings_table='VectorIndex'
max_sql_len=65536

def generate_document_embeddings(request:DocumentEmbeddingRequest):

    file_loader=None

    mode='single'

    document_path=request.location
    content_type=request.contentType

    if document_path.startswith('s3://'):
        s3Path=parse_s3_path(document_path)
        file_loader=S3FileLoader(
            s3Path['bucket'],
            s3Path['key'],
        )
        file_loader.mode=mode
    elif document_path.startswith('https://') or document_path.startswith('http://'):
        file_loader=UnstructuredURLLoader([document_path], mode=mode)
    elif document_path.endswith('/*'):
        file_loader=DirectoryLoader(
            document_path,
            show_progress=True,
            loader_cls=UnstructuredFileLoader,
            loader_kwargs={
                "mode":mode
            }
        )
    elif content_type.endswith('/pdf'):
        file_loader=UnstructuredPDFLoader(document_path, mode=mode)
    elif content_type.endswith('/html'):
        file_loader=UnstructuredHTMLLoader(document_path, mode=mode)
    elif content_type.endswith('/markdown'):
        file_loader=UnstructuredMarkdownLoader(document_path, mode=mode)
    else:
        file_loader=UnstructuredFileLoader(document_path, mode=mode)


    docs=file_loader.load()

    text_splitter=CharacterTextSplitter(chunk_size=300, chunk_overlap=20)
    docs=text_splitter.split_documents(docs)


    first=True
    all=[]
    print('Generating embeddings')
    for doc in docs:
        vec=encode_text(doc.page_content)
        all.append({
            **request.cols,
            "vector":vec,
            "text":doc.page_content
        })
        if first:
            first=False
            #print(all[0])


    colNamesEscaped=[]
    colNames=[]
    if request.cols:
        for colName in request.cols:
            colNames.append(colName)
            colNamesEscaped.append(escape_sql_identifier(colName))

    colNameSql=''
    if len(colNamesEscaped):
        colNameSql=','+(','.join(colNamesEscaped))

    inserted=0
    total_inserted=0
    head=f'INSERT INTO {escape_sql_identifier(embeddings_table)} ("text","vector"{colNameSql}) VALUES '

    sql_chucks=[head]
    sql_len=len(head)

    for index in all:

        chunk=sql.SQL("({text},{vector}").format(
            text=index["text"],
            vector=json.dumps(index["vector"])
        ).as_string(None)


        if len(colNames) and request.cols:
            colData=[]
            for colName in colNames:
                colData.append(sql.SQL("{value}").format(
                    value=request.cols[colName],
                ).as_string(None))
            chunk=chunk+','+(','.join(colData))


        chunk=chunk+'),'

        chunk_len=len(chunk)

        if chunk_len + sql_len >= max_sql_len:
            print(f'Inserting {inserted} embeddings into {embeddings_table}')
            exec_sql(''.join(sql_chucks)[:-1],request.dryRun)
            inserted=0
            sql_chucks=[head]
            sql_len=len(head)

        sql_len=sql_len+chunk_len
        sql_chucks.append(chunk)

        inserted=inserted+1
        total_inserted=total_inserted+1

    if inserted > 0:
        print(f'Inserting {inserted} embeddings into {embeddings_table}')
        exec_sql(''.join(sql_chucks)[:-1],request.dryRun)

    print(f'Inserted {total_inserted} embeddings into {embeddings_table}')

    return total_inserted



