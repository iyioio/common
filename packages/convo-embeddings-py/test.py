from src.convo_embeddings.embed_documents import generate_document_embeddings
from src.convo_embeddings.types import DocumentEmbeddingRequest
from dotenv import load_dotenv

load_dotenv('/Users/scott/docs/liirn-space/.env.local')
load_dotenv('/Users/scott/docs/liirn-space/.env')
load_dotenv('/Users/scott/docs/liirn-space/.env.cdk')


#generate_document_embeddings('/Users/scott/docs/convo-lang-mgr/Documents/Convo-2024-01-24-(1).pdf','application/pdf',docTemplate)

#generate_document_embeddings('s3://liirnspace-bucksmediabucket70ce2cea-11rljmkq8tolk/bn3Pk99FQrKYNduH8zj4Rw8FeFjurMSkeA4Xp1nhCbXg','application/pdf',docTemplate)

#generate_document_embeddings('https://liirnspace-bucksmediabucket70ce2cea-11rljmkq8tolk.s3.amazonaws.com/bn3Pk99FQrKYNduH8zj4Rw8FeFjurMSkeA4Xp1nhCbXg','application/pdf',docTemplate)

#generate_document_embeddings('https://en.wikipedia.org/wiki/Magna_Lykseth-Skogman','text/html',docTemplate)

s3Key='bn3Pk99FQrKYNduH8zj4Rw8FeFjurMSkeA4Xp1nhCbXg'
generate_document_embeddings(DocumentEmbeddingRequest(
    dryRun=True,
    #location='/Users/scott/docs/convo-lang-mgr/Documents/Convo-2024-01-24-(1).pdf',
    contentCategoryFilter=['document'],
    location='s3://liirnspace-bucksmediabucket70ce2cea-11rljmkq8tolk/bn3Pk99FQrKYNduH8zj4Rw8FeFjurMSkeA4Xp1nhCbXg',
    contentCategoryCol='contentCategory',
    contentTypeCol='contentType',
    cols={
        "sourceTitle":"Dumpling",
        "sourceId":f"{s3Key}"
    },

))
#https://liirnspace-bucksmediabucket70ce2cea-11rljmkq8tolk.s3.amazonaws.com/aGBfKn60TaCreg-EwLI46AIe23r9QdStqEUyYqGpyA0w
