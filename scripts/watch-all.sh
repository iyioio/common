#!/bin/bash
set -e
cd $(dirname "$0")
source ./config.sh

trap "kill -- -$$" SIGINT SIGTERM EXIT

LOGS=`aws logs describe-log-groups --max-items 10000`

LOG_GROUPS=`
node --harmony << EOF
const groups=$LOGS.logGroups.map(l=>l.logGroupName);
for(const g of groups){
    console.log(g);
}
EOF
`

if [ "$LOG_GROUPS" == "" ]; then
    echo "No log groups found"
    exit 1
fi

while IFS= read -r GROUP_NAME; do
    echo "Watching $GROUP_NAME"
    echo -en "\033]0;$GROUP_NAME\a"

    aws logs tail "$GROUP_NAME" --follow --since 10m &
done <<< "$LOG_GROUPS"

while [ true ]
do
    sleep 10
done
