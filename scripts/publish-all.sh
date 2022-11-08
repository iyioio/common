#!/bin/bash
set -e
cd "$(dirname "$0")/.."

scripts/build-all.sh

scripts/test-all.sh

node tools/scripts/publish-all.mjs $1 $2 $3 $4 $5

scripts/get-npm-install-commands.sh
