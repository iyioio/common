#!/bin/bash
set -e
cd "$(dirname "$0")"

dockerDir=`pwd`

cd ../..

docker build --progress=plain --platform linux/amd64 -t convo-embeddings -f "$dockerDir/Dockerfile" .
