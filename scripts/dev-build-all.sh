#!/bin/bash
set -e
cd "$(dirname "$0")/.."

npx nx run-many --target=build

node tools/scripts/install-dist-local-deps.mjs
