FROM python:3.11

WORKDIR /app

RUN apt-get install libmagic1

RUN python3 -m pip install --upgrade pip

COPY packages/convo-embeddings-py/requirements.txt requirements.txt

RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY packages/ai-models/all-mpnet-base-v2/ packages/ai-models/all-mpnet-base-v2

COPY packages/iyio-common-py/src/ packages/iyio-common-py/src

COPY packages/convo-embeddings-py/main.py packages/convo-embeddings-py/main.py

COPY packages/convo-embeddings-py/src/ packages/convo-embeddings-py/src

RUN find . -type f

ENV PYTHONPATH=/app/packages/iyio-common-py/src
ENV REST_PORT=8080

EXPOSE 8080

WORKDIR /app/packages/convo-embeddings-py

CMD [ "python3", "/app/packages/convo-embeddings-py/main.py" ]
