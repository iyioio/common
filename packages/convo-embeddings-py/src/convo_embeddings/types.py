from dataclasses import dataclass
from typing import Any, Dict, Optional, List

@dataclass
class DocumentEmbeddingRequest:
    """ Defines properties for generating embeddings for a given document """

    # location of the document to index. Can be a file path, url or s3 url
    # if set to "inline" the content of the inlineContent prop will be used.
    location:str


    # The content type of the document
    contentType:Optional[str]=None

    # Inline content
    inlineContent:Optional[str]=None

    # Name fo the table to insert embeddings into
    embeddingsTable:str='VectorIndex'

    # Additional colum values to insert into vector index table
    cols:Dict[str,Any]|None=None

    # If true embeddings for the document are generated by not inserted in to the embeddings table
    dryRun:bool=False

    contentTypeCol:Optional[str]=None

    contentCategoryCol:Optional[str]=None

    contentCategoryFilter:Optional[List[str]]=None
