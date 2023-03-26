import chalk from 'chalk';
import { constants } from 'fs';
import { access, readFile, writeFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';

const statePath=process.env['NX_PROTOGEN_STATE_PATH'];
const tsDir=process.env['NX_PROTOGEN_TS_DIR'];
const defaultFile=process.env['NX_PROTOGEN_TS_DEFAULT_FILE']??'models.ts';
const removeDir=process.env['NX_PROTOGEN_REMOVE_TS_DIR']==='true';

export default async function protogenApiHandler (req: NextApiRequest, res: NextApiResponse)
{
    if(!statePath){
        res.status(500).send('NX_PROTOGEN_STATE_PATH env var not set');
        return;
    }
    try{
        switch(req.method){

            case 'POST':{
                let body:string;
                let state:string;
                try{
                    state=JSON.parse(req.body);
                    body=JSON.stringify(state,null,4);
                }catch{
                    res.status(400).send('');
                    return;
                }
                await writeFile(statePath,body);
                console.info(chalk.green(`protogen state saved to ${statePath}`));

                // if(tsDir){
                //     await generateTsAsync(tsDir,state);
                // }

                res.status(204).send('');
                return;
            }

            case 'GET':{
                const state:string=JSON.parse((await readFile(statePath)).toString());
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

// const generateTsAsync=async (rootDir:string,state:string)=>{
//     const generator=new Generator({
//         lang:'typescript',
//         defaultFilePath:defaultFile,
//         state,
//         langGenerators:[new TypeScriptLanguageGenerator()],
//         entityGenerators:[new TypeScriptEntityGenerator()],
//         memberGenerators:[new TypeScriptMemberGenerator()]
//     })
//     const result=await generator.generateAsync();

//     if(removeDir && existsAsync(rootDir)){
//         console.info(chalk.yellow(`Removing ts root dir ${rootDir}`));
//         await rm(rootDir,{recursive:true});
//     }

//     for(const file of result.files){

//         const filePath=join(rootDir,file.path);
//         const dir=dirname(filePath);

//         if(!await existsAsync(dir)){
//             await mkdir(dir,{recursive:true});
//         }

//         const lines:string[]=[];
//         appendContentToArray(file.content,lines);
//         await writeFile(filePath,lines);
//         console.info(chalk.green(`generated ${filePath}`));
//     }

// }

const existsAsync=async (path:string)=>{
    try{
        await access(path,constants.R_OK);
        return true;
    }catch{
        return false;
    }
}
