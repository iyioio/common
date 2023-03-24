#!/bin/bash
set -e
cd "$(dirname "$0")"

npx ts-node -r tsconfig-paths/register src/lib/protogen-cli-entry.ts test.csv -o test.ts
