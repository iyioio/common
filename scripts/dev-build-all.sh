#!/bin/bash
set -e
cd "$(dirname "$0")/.."


node tools/scripts/install-dist-local-deps.mjs "$@"
