from src.convo_retrievals.embed_documents import generate_document_list
from src.convo_retrievals.types import DocumentRetrievalRequest

docs = generate_document_embeddings(DocumentRetrievalRequest(
    prompt='Test'
))
print(docs)
