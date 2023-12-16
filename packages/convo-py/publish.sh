#!/bin/bash
set -e
cd "$(dirname "$0")"

./build

python3 -m twine upload dist/*
