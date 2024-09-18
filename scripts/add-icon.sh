#!/usr/bin/env bash

# This script relies on the phillsv87/resources repo being clone in the same parent directory as this repo

set -e
cd "$(dirname "$0")/.."

pkg=$1
name=$2

if [ "$pkg" == "" ]; then
    echo "first argument must be the name of the package to add the icon to"
    exit 1
fi

if [ "$name" == "" ]; then
    echo "second argument must be the name of the icon to add"
    exit 1
fi

dir="$(pwd)/packages/$pkg/src/lib"

if [ ! -d "$dir" ]; then
    echo "package not found at $dir"
    exit 1
fi

OUT="$dir/$pkg-icons.tsx"

pushd ../resources
./convert-svg-icon-v2.js --paste --out "$OUT" --inline --require-name --name "$name"
popd


echo "New icons added to $OUT"
