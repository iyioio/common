#!/bin/bash
set -e
cd "$(dirname "$0")"
source ./config.sh

OUTPUT=`aws cloudformation describe-stacks \
    --stack-name $NX_STACK_NAME \
    --output json \
    --query "Stacks[0].Outputs"`

node --harmony << EOF
let outputs=($OUTPUT||{}).reduce((c,n)=>(c[n.OutputKey]=n.OutputValue,c),{});

const varName='$1'

const formatName=(name)=>{

    if(name.endsWith('Param')){
        name=name.substring(0,name.length-"Param".length);
    }

    if(name.includes('_') && name===name.toUppercase()){
        return name;
    }

    name=name.replace(/[A-Z]+/g,m=>'_'+m);
    return (name[0]==='_'?name.substring(1):name).toUpperCase();
}

if(varName){
    if(varName==='--raw'){
        console.log(JSON.stringify(outputs,null,4));
    }else{
        const value=outputs[varName];
        if(value==='undefined'){
            throw new Error('$1 not found in cdk output');
        }
        console.log(value);
    }
}else{
    const keys=Object.keys(outputs);
    keys.sort((a,b)=>a.localeCompare(b))

    for(const e of keys){
        if(!e.endsWith('Param')){
            continue;
        }
        console.log('NX_'+formatName(e)+'='+outputs[e]);
    }
}

EOF
