# This Dockerfile should be build at the root of the iyio-common repo.
# Use the build-image.sh script to build or the test-image.sh script to test

FROM python:3.11

WORKDIR /app

RUN apt-get install libmagic1

RUN python3 -m pip install --upgrade pip

COPY packages/convo-embeddings-py/requirements.txt requirements.txt

RUN python3 -m pip install --no-cache-dir -r requirements.txt

COPY packages/ai-models/all-mpnet-base-v2/ packages/ai-models/all-mpnet-base-v2

COPY packages/iyio-common-py/src/ packages/iyio-common-py/src

COPY packages/convo-embeddings-py/rest_api.py packages/convo-embeddings-py/rest_api.py
COPY packages/convo-embeddings-py/ingest_queued.py packages/convo-embeddings-py/ingest_queued.py

COPY packages/convo-embeddings-py/src/ packages/convo-embeddings-py/src

ENV PYTHONPATH=/app/packages/iyio-common-py/src
ENV REST_PORT=8080

EXPOSE 8080

WORKDIR /app/packages/convo-embeddings-py

CMD [ "python3", "rest_api.py" ]
