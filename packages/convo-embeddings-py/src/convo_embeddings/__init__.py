from .embed_documents import generate_document_embeddings
from .types import DocumentEmbeddingRequest
from .embed import encode_text

def request_handler(path,data,method):
    """ Handles an http request. data is either the request body or query params for a GET request """

    if data and data['document-location'] and data['content-type'] and data['source-id']:
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
