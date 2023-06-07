import type { NextApiRequest, NextApiResponse } from 'next';


export default async function apiHandler (req: NextApiRequest, res: NextApiResponse)
{
    res.status(200).json(process.env['NX_PROTOGEN_CONFIGS']?.split(',').map(s=>s.trim())??[]);
}
