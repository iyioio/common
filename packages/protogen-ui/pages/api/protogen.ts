import { pathExistsAsync } from '@iyio/node-common';
import { runProtogenCliAsync } from '@iyio/protogen-runtime';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';
import { SaveRequest } from '../../lib/protogen-ui-lib';

const defaultFile=process.env['NX_PROTOGEN_DEFAULT_FILE']??'protogen';
const saveDir=process.env['NX_PROTOGEN_SAVE_DIR']??'.';
const snapshotDir=process.env['NX_PROTOGEN_SNAPSHOT_DIR']??'.';
const tsDir=process.env['NX_PROTOGEN_TS_DIR'];
const defaultTsFile=process.env['NX_PROTOGEN_TS_DEFAULT_FILE']??'models.ts';

const notNameReg=/[^\w-]/g;

export default async function protogenApiHandler (req: NextApiRequest, res: NextApiResponse)
{
    try{
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
                const path=join(request.snapshot?saveDir:snapshotDir,name);
                await writeFile(path,request.content);
                console.info(chalk.green(`protogen state saved to ${path}`));

                if(tsDir && !request.snapshot){
                    await runProtogenCliAsync([
                        '-v',
                        '-i',
                        path,
                        '-o',
                        defaultTsFile,
                        '-lp',
                        'packages/protogen-runtime/src/lib/test-plugins/echo-generator.ts:'+
                        'packages/protogen-runtime/tsconfig.json'
                    ],0,require);
                }

                res.status(204).send('');
                return;
            }

            case 'GET':{
                const name=(defaultFile).replace(notNameReg,'')+'.md';
                const path=join(saveDir,name);
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
