from sentence_transformers import SentenceTransformer
import time

modelPath='./models/all-mpnet-base-v2'

model = SentenceTransformer(modelPath)

def encode_text(sentences):

    return model.encode(sentences).tolist()
