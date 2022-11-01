#!/bin/bash
set -e
cd "$(dirname "$0")"
source ./config.sh


STACK_NAME=TestResources

OUTPUT=`aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --output json \
    --query "Stacks[0].Outputs"`

node --harmony << EOF
let outputs=$OUTPUT.reduce((c,n)=>(c[n.OutputKey]=n.OutputValue,c),{});

const formatName=(name)=>{
    name=name.replace(/[A-Z]+/g,m=>'_'+m);
    return (name[0]==='_'?name.substring(1):name).toUpperCase();
}

for(const e in outputs){
    console.log('NX_'+formatName(e)+'='+outputs[e]);
}

EOF
