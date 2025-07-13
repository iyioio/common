#!/bin/bash
set -e
cd "$(dirname "$0")"

cp test-zod.js v3/_test.js
cp test-zod.js v4/_test.js

Echo "Zod v3"
cd v3
node _test.js

Echo "Zod v4"
cd ../v4
node _test.js
