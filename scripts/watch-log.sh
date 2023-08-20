#!/bin/bash
set -e
cd $(dirname "$0")
source ./config.sh

NAME=$1

LOGS=`aws logs describe-log-groups --max-items 10000`

GROUP=`
node --harmony << EOF
const group=$LOGS.logGroups.find(l=>l.logGroupName.toLowerCase().includes('$NAME'.toLowerCase()))
console.log(group?.logGroupName??'')
EOF
`

if [ "$GROUP" == "" ]; then
    echo "No log group found matching $NAME"
    exit 1
fi

echo "Watching $GROUP"
echo -en "\033]0;$NAME - $GROUP\a"

aws logs tail "$GROUP" --follow --since 10m
