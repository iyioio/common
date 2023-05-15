#!/bin/bash

# This script relies on the phillsv87/resources repo being clone in the same parent directory as this repo

set -e
cd "$(dirname "$0")/.."

pushd ../resources
ICON=$(./convert-svg-icon.js "$@" --inline)
popd

ICON_SOURCE=$(cat packages/react-common/src/lib/icon/icon-source.tsx)



ICON=$(
node --harmony << EOF
const icon=\`$ICON\`
const source=\`$ICON_SOURCE\`
console.log(source.replace(/\/\/\s*END/g,(_)=>icon+'\\n    '+_))
EOF
)

printf "$ICON" > packages/react-common/src/lib/icon/icon-source.tsx

echo "New icons added to packages/react-common/src/lib/icon/icon-source.tsx"
