#!/bin/bash
set -e
cd "$(dirname "$0")"

./build-image.sh

export DOCKER_DEFAULT_PLATFORM=linux/amd64

docker run -it --rm -p "8080:8080" convo-embeddings-py
