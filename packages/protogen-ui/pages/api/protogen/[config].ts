import { arySingle } from '@iyio/common';
import { pathExistsAsync } from '@iyio/node-common';
import { ProtoConfig } from '@iyio/protogen';
import { getCdkProtoPipelinePlugins } from '@iyio/protogen-cdk';
import { runProtogenCliAsync } from '@iyio/protogen-runtime';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import { dirname, join } from 'path';
import { setApiOutput } from '../../../lib/protogen-api-lib.js';
import { SaveRequest } from '../../../lib/protogen-ui-lib.js';

//const configPath=process.env['NX_PROTOGEN_CONFIG'];

const notNameReg=/[^\w-]/g;

export default async function protogenApiHandler (req: NextApiRequest, res: NextApiResponse)
{
    try{

        const configId=arySingle(req.query['config'])??'';
        const configPath=process.env['NX_PROTOGEN_CONFIG_'+configId.toUpperCase()];
        if(!configPath){
            res.status(404);
            return;
        }

        const json=(await readFile(configPath??'./protogen-config.json')).toString();
        const {
            pipeline,
            saveDir='.',
            snapshotDir='.protogen/snapshots',
            defaultFile='protogen'
        }=JSON.parse(json) as ProtoConfig;

        if(!pipeline.plugins){
            pipeline.plugins=[];
        }

        pipeline.plugins.push(...getCdkProtoPipelinePlugins());

        if(!pipeline.workingDirectory && configPath){
            pipeline.workingDirectory=dirname(configPath);
        }

        const workingDir=pipeline?.workingDirectory??'.';

        switch(req.method){

            case 'POST':{
                let request:SaveRequest;
                try{
                    request=JSON.parse(req.body);
                }catch{
                    res.status(400).send('');
                    return;
                }
                const name=(request.name??defaultFile).replace(notNameReg,'')+(
                    request.snapshot?getSnapName():''
                )+'.md';
                const path=join(workingDir,request.snapshot?snapshotDir:saveDir,name);
                await writeFile(path,request.content);
                console.info(chalk.green(`protogen state saved to ${path}`));

                if(request.executePipeline && !request.snapshot){
                    const outputId=request.outputId;
                    let isVerbose:boolean;
                    await runProtogenCliAsync({
                        config:pipeline,
                        args:pipeline,
                        onOutputReady:v=>isVerbose=v,
                        logOutput:outputId?(...args:any[])=>{
                            if(isVerbose){
                                console.info(...args);
                            }
                            setApiOutput(outputId,args.join(' ')+'\n',true);
                        }:undefined
                    });
                    if(outputId){
                        setTimeout(()=>{
                            setApiOutput(outputId,null);
                        },6000);
                    }
                    console.info(chalk.green(`protogen pipeline execution success`));
                }

                res.status(204).send('');
                return;
            }

            case 'GET':{
                const name=(defaultFile).replace(notNameReg,'')+'.md';
                const path=join(workingDir,saveDir,name);
                const state=(await pathExistsAsync(path))?(await readFile(path)).toString():'';
                res.status(200).json(state);
                return;
            }
        }
        res.status(404).send('');
    }catch(ex){
        console.error('Internal server error',ex);
        res.status(500).send('Internal server error');
    }
}

const getSnapName=()=>{
    const date=new Date();
    return `-${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}T${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`
}
