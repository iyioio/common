#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo 'Creating project graph'
node tools/scripts/create-project-graph.mjs

echo 'Building packages in dev mode'
node tools/scripts/install-dist-local-deps.mjs "$@"
