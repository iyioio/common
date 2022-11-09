#!/bin/bash
set -e
cd "$(dirname "$0")/.."

node tools/scripts/get-npm-install-commands.mjs "$@"
