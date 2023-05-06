import { AiCompletionRequest, aiComplete } from '@iyio/ai-complete';
import { openAiModule } from '@iyio/ai-complete-openai';
import { EnvParams, initRootScope } from '@iyio/common';
import { NextApiRequest, NextApiResponse } from 'next';



export default async function completeApiHandler (req: NextApiRequest, res: NextApiResponse)
{
    try{
        initRootScope(reg=>{
            reg.addParams(new EnvParams());
            openAiModule(reg);
        })
    }catch{
        //
    }
    //await rootScope.getInitPromise();

    const request:AiCompletionRequest=typeof req.body==='string'?JSON.parse(req.body):req.body;

    const r=await aiComplete().completeAsync(request);

    res.status(200).json(r);
}
