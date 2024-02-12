from ast import List
from dataclasses import dataclass
from typing import Any, Dict

@dataclass
class DocumentRetrievalRequest:
    """ Defines properties for generating a list of retrieved documents for a given prompt"""

    # prompt for the documents to retrieve
    prompt:str

    # Name for the table to extract embeddings from
    embeddingsTable:str='VectorIndex'

    # Additional colum values to read from vector index table
    cols:Dict[str,Any]|None=None

    # list of the documents to be returned
    # docs:List[Document]
