#!/bin/bash
set -e
cd "$(dirname "$0")"

docker build --platform linux/amd64 -t convo-embeddings .
