#!/bin/bash
set -e
cd "$(dirname "$0")/.."

rm -rf node_modules/.cache
rm -rf dist

npx nx reset
rm -rf node_modules/.cache
