#!/bin/bash
set -e

# This script installs the resources need by @iyio/pdf-viewer into the public directory of another package
# This script should be ran from the root of your repo, the parent directory of the packages directory.

pkgName=$1

if [ "$pkgName" == "" ]; then
    echo 'package name not supplied'
    exit 1
fi

rm -rf "packages/$pkgName/public/pdfjs"

mkdir -p "packages/$pkgName/public/pdfjs"

cp -rv node_modules/pdfjs-dist/web "packages/$pkgName/public/pdfjs/web"
cp -rv node_modules/pdfjs-dist/build "packages/$pkgName/public/pdfjs/build"
