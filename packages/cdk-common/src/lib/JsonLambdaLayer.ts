import { strHash } from "@iyio/common";
import { CustomResource, Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cr from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { NodeFn } from "./NodeFn";

export interface JsonLambdaLayerProps{
    json:Record<string,any>;
    bucketKey?:string;
    zipFilePath:string;
    layerProps?:lambda.LayerVersionProps;
    /**
     * If set and bucketKey is not defined keySalt will be used to salt the random key that is generated.
     */
    keySalt?:string;
}

/**
 * Creates a lambda layer that defines a json object and the json object can have cdk tokens as
 * values. This construct can allow you to store configuration values that are only available at
 * deploy time in lambda layer.
 */
export class JsonLambdaLayer extends Construct
{

    public readonly layer:lambda.LayerVersion;

    public constructor(scope:Construct,name:string,{
        json,
        layerProps,
        bucketKey,
        zipFilePath,
        keySalt='',
    }:JsonLambdaLayerProps){
        super(scope,name);

        const bucket=new s3.Bucket(this,'Bucket',{
            removalPolicy:RemovalPolicy.DESTROY,
            autoDeleteObjects:true,
        })

        const provider=SourceLayerFunctionProvider.getOrCreate(this);

        bucket.grantReadWrite(provider.func.func);
        bucket.grantDelete(provider.func.func);

        const keys=Object.keys(json);
        keys.sort((a,b)=>a.localeCompare(b));
        const valuesAry:string[]=[];
        const values:Record<string,any>={};
        for(let i=0;i<keys.length;i++){
            const k=keys[i];
            if(!k){continue}
            values['_'+i]=json[k];
            valuesAry.push(JSON.stringify(json[k]??null).replace(/\$\{Token\[TOKEN.\w+\]\}/g,'${Token[TOKEN]}'))
        }

        if(!bucketKey){
            bucketKey=`layer-source-${encodeURIComponent(strHash(keySalt+keys.join(','))+'-'+strHash(valuesAry.join(',')))}.zip`
        }


        const res=new CustomResource(this, 'SourceLayerCustomResource', {
            serviceToken:provider.provider.serviceToken,
            resourceType:'Custom::SourceLayer',
            properties:{
                bucketArn:bucket.bucketArn,
                bucketKey,
                zipFilePath,
                keys:keys.join(','),
                ...values
            },
        });

        res.node.addDependency(bucket);

        const layer=new lambda.LayerVersion(this,'Layer',{
            removalPolicy:RemovalPolicy.DESTROY,
            compatibleArchitectures:[lambda.Architecture.ARM_64,lambda.Architecture.X86_64],
            ...layerProps,
            code:lambda.Code.fromBucket(bucket,bucketKey)
        })

        layer.node.addDependency(res);

        this.layer=layer;
    }
}



class SourceLayerFunctionProvider extends Construct
{

    public static getOrCreate(scope:Construct):SourceLayerFunctionProvider
    {
        const id='SourceLayerFunctionProvider';
        const stack=Stack.of(scope);
        return (
            stack.node.tryFindChild(id) as SourceLayerFunctionProvider ??
            new SourceLayerFunctionProvider(stack,'SourceLayerFunctionProvider')
        )
    }

    public readonly provider: cr.Provider;
    public readonly func:NodeFn;
    private constructor(scope:Construct,id: string)
    {
        super(scope,id);
        this.func=new NodeFn(this,'JsonZipperFn',{
            timeout:Duration.minutes(15),
            memorySize:1024,
            bundledHandlerFileNames:[
                '../../dist/packages/iyio-util-fns/handlers/JsonZipperFn',
                '../../node_modules/@iyio/iyio-util-fns/handlers/JsonZipperFn',
            ]
        });

        this.provider=new cr.Provider(this,'SourceLayerFunctionProviderHandler', {
            onEventHandler:this.func.func
        });
    }
}
