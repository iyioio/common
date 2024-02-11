import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { OnEventRequest } from "@iyio/aws";
import { formatBucketName } from "@iyio/aws-s3";
import { createReadStream, createWriteStream, writeFileSync } from "fs";
import { tmpdir } from 'os';
import { join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const archiver=require('archiver');

const JsonZipperFn=async (event: OnEventRequest)=>{

    console.log('ZipperFn',JSON.stringify(event,null,4))

    const bucketArn=event.ResourceProperties['bucketArn'];
    const bucketKey=event.ResourceProperties['bucketKey'];
    const zipFilePath=event.ResourceProperties['zipFilePath'];
    const keys:string[]=event.ResourceProperties['keys']?.split?.(',');
    if(!bucketArn){
        throw new Error('bucketArn required as a resource property');
    }
    if(!bucketKey){
        throw new Error('bucketKey required as a resource property');
    }
    if(!zipFilePath){
        throw new Error('zipFilePath required as a resource property');
    }
    if(!keys){
        throw new Error('keys required as a resource property');
    }

    const client=new S3Client();

    switch (event.RequestType) {
        case "Create":
        case "Update":{

            const json:Record<string,any>={}
            for(let i=0;i<keys.length;i++){
                const k=keys[i];
                if(!k){continue}

                const v=event.ResourceProperties['_'+i];
                if(v===undefined){
                    throw new Error(`_${i} expected to contain the value of ${k}`)
                }
                json[k]=v;
            }

            const outPath=join(tmpdir(),(Date.now()+'_'+Math.round(Math.random()*1000)).toString());

            writeFileSync(outPath,JSON.stringify(json));

            const output=createWriteStream(outPath+'.zip');

            const archive=archiver('zip',{
                zlib:{level:0}
            });
            archive.pipe(output);
            archive.file(outPath,{name:zipFilePath});

            await archive.finalize();

            await new Promise<void>(r=>{
                output.close(()=>r());
            });


            await client.send(new PutObjectCommand({
                Key:bucketKey,
                Bucket:formatBucketName(bucketArn),
                Body:createReadStream(outPath+'.zip'),
            }))


            break;
        }

        case "Delete":{
            try{
                await client.send(new DeleteObjectCommand({
                    Key:bucketKey,
                    Bucket:formatBucketName(bucketArn),
                }))
            }catch{
                //
            }
            break;
        }
    }

    return {
        PhysicalResourceId:'Zipper_dSiYFpN3BDTzDKDpsexw'
    }
}

export const handler=JsonZipperFn;


