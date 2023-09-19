import { aiCompletionFnArnParam } from '@iyio/ai-complete';
import { openAiSecretsParam } from '@iyio/ai-complete-openai';
import { FnsBuilder, ManagedProps, NodeFn, NodeFnProps } from '@iyio/cdk-common';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AiCompleteOpenAiConstructOptions
{
    managed?:ManagedProps;
    defaultFnProps?:NodeFnProps;
    fnName?:string;
    grantAccess?:boolean;
}

export class AiCompleteOpenAiConstruct extends Construct
{

    public readonly handlerFn:NodeFn;

    public readonly fnBuilder:FnsBuilder;

    public constructor(scope:Construct,id:string,{
        managed={},
        defaultFnProps,
        fnName="OpenAiCompletionFn",
        grantAccess
    }:AiCompleteOpenAiConstructOptions={})
    {
        super(scope,id);

        const {params}=managed;

        const fnBuilder=new FnsBuilder(this,"Fns",{
            fnsInfo:[
                {
                    name:fnName,
                    arnParam:aiCompletionFnArnParam,
                    grantAccess,
                    createProps:{
                        handlerFileName:'../../packages/ai-complete-openai-cdk/src/lib/handlers/CompleteOpenAiPrompt.ts',
                        timeoutMs:1000*60*5,
                        ...defaultFnProps,
                    },
                },
            ],
            managed,
        })

        this.fnBuilder=fnBuilder;

        const handlerFn=fnBuilder.fns.find(f=>f.info.name===fnName)?.fn;
        if(!handlerFn){
            throw new Error('FnsBuilder did not create a matching named fn');
        }

        this.handlerFn=handlerFn;

        const secret=new secrets.Secret(this,'ApiKey');
        secret.grantRead(handlerFn.func);

        if(params){
            params.setParam(openAiSecretsParam,secret.secretArn);
        }
    }
}
