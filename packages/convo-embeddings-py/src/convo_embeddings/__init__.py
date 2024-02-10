from typing import Dict
from .embed_documents import generate_document_embeddings
from .types import DocumentEmbeddingRequest
from .embed import encode_text

def request_handler(path,data:Dict[str,str],method):
    """ Handles an http request. data is either the request body or query params for a GET request """

    if data and ('document-location' in data) and ('content-type' in data) and ('source-id' in data):
        return generate_document_embeddings(DocumentEmbeddingRequest(
            location=data['document-location'],
            contentType=data['content-type'],
            cols={
                "sourceId":data['source-id']
            }
        ))
    elif method == "GET":
        return encode_text([data['text'] if 'text' in data else ""])
    else:
        return encode_text(data)
