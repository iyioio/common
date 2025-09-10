import { arySingle } from '@iyio/common';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getApiOutput } from '../../../../lib/protogen-api-lib.js';

export default async function protogenApiHandler (req: NextApiRequest, res: NextApiResponse)
{
    try{
        switch(req.method){

            case 'GET':{
                const outputId=arySingle(req.query['outputId'])??'';
                const out=getApiOutput(outputId);
                if(out===undefined){
                    res.status(200).json(null);
                }else{
                    res.status(200).json(out);
                }
                return;
            }
        }
        res.status(404).send('');
    }catch(ex){
        console.error('Internal server error',ex);
        res.status(500).send('Internal server error');
    }
}
