import { ExecutorContext } from '@nrwl/devkit';
import { tscExecutor } from '@nrwl/js/src/executors/tsc/tsc.impl';
import type { ExecutorOptions } from '@nrwl/js/src/utils/schema';
import { access, readFile, writeFile } from 'fs/promises';
import { LibBuilderExecutorSchema } from './schema';
import Path = require('path');

const autoConfig='auto';

const updateDeps=(filter:string|RegExp,type:'^'|'~'|'>=',deps:{[depName:string]:string},updates:{[depName:string]:string})=>{

    if(!deps || !filter){
        return;
    }
    let match:RegExpExecArray|null=null;
    for(const name in deps){
        const version=deps[name];
        console.log(`${name} -> ${version}`)
        if( ((typeof filter ==='string')?
                name.startsWith(filter) && !version.startsWith('^') && !version.startsWith('~'):
                (match=filter.exec(version))
            ) && !updates[name]
        ){
            updates[name]=deps[name]=type+(match?.[1]??version);
        }
    }
}

export default async function runExecutor(
    {
        noSideEffects=true,
        passthrough=false,
        approximatelyDeps=process.env['NX_LIB_APPROXIMATELY_DEPS'],
        compatibleDeps=process.env['NX_LIB_COMPATIBLE_DEPS'],
        moreThanEqDeps=process.env['NX_LIB_MORE_EQ_DEPS']==='true' || process.env['NX_LIB_MORE_EQ_DEPS']==='1',

        watch,
        outputPath,
        tsConfig,

        commonJsTsConfig=autoConfig,

        disableEsm=false,
        esmDir='esm',
        esmTsConfig=autoConfig,
        esmModuleType='ES2015',
        autoCreateEsmConfig=true,

        ...tscOptions

    }: LibBuilderExecutorSchema,
    context: ExecutorContext
):Promise<{success:boolean}>{

    if(process.env['NX_LIB_BUILDER_PASSTHROUGH']==='true'){
        passthrough=true;
    }

    if(passthrough){
        console.info('Passing execution directly to @nrwl/js:tsc');
        const r=await buildAsync({
            ...tscOptions,
            watch,
            outputPath,
            tsConfig
        },context);
        return {success:r.success};
    }

    const results:BuildResult[]=[];


    if(!commonJsTsConfig || commonJsTsConfig===autoConfig){
        commonJsTsConfig=tsConfig;
    }

    results.push(await (async ()=>{
        console.info(`building CommonJs - ${outputPath}`)
        const r=await buildAsync({
            ...tscOptions,
            outputPath,
            tsConfig:commonJsTsConfig,
            watch
        },context);

        if(!r.success){
            return r;
        }

        const packageJsonPath=Path.join(outputPath,'package.json');
        const pkg=JSON.parse((await readFile(packageJsonPath)).toString());

        delete pkg.type;

        if(pkg.sideEffects===undefined && noSideEffects){
            pkg.sideEffects=false;
        }
        if(!disableEsm){
            const mainParts=(pkg.main as string).split('/');
            mainParts.splice(mainParts[0]==='.'?1:0,0,esmDir)
            pkg.module=mainParts.join('/');
        }

        const updates:{[name:string]:string}={};

        if(compatibleDeps){
            updateDeps(compatibleDeps,'~',pkg.dependencies,updates);
            updateDeps(compatibleDeps,'~',pkg.devDependencies,updates);
            updateDeps(compatibleDeps,'~',pkg.peerDependencies,updates);
        }

        console.log(`__________________ ${approximatelyDeps}, ${moreThanEqDeps}, ${JSON.stringify(process.env['NX_LIB_MORE_EQ_DEPS'])}`)

        if(approximatelyDeps){
            updateDeps(approximatelyDeps,'^',pkg.dependencies,updates);
            updateDeps(approximatelyDeps,'^',pkg.devDependencies,updates);
            updateDeps(approximatelyDeps,'^',pkg.peerDependencies,updates);
        }

        if(moreThanEqDeps){
            const reg=/([0-9][0-9.]*.*)/
            updateDeps(reg,'>=',pkg.dependencies,updates);
            updateDeps(reg,'>=',pkg.devDependencies,updates);
            updateDeps(reg,'>=',pkg.peerDependencies,updates);
        }

        await writeFile(packageJsonPath,JSON.stringify(pkg,null,4));

        if(pkg.main){
            const srcPackageJsonPath=Path.join(outputPath,Path.dirname(pkg.main),'package.json');
            if(!await existsAsync(srcPackageJsonPath)){
                await writeFile(srcPackageJsonPath,JSON.stringify({
                    type: "commonjs",
                    sideEffects: !noSideEffects,
                },null,4))
            }
        }

        return r;
    })());

    if(!disableEsm && !watch){

        if(!esmTsConfig || esmTsConfig===autoConfig){
            esmTsConfig=tsConfig.replace(/\.(\w+)$/,(_,ext)=>`-esm.${ext}`);
        }

        if(!await existsAsync(esmTsConfig)){
            if(!autoCreateEsmConfig){
                console.error('esmTsConfig file not found and autoCreateEsmConfig is set to false')
                return {
                    success:false
                }
            }
            console.info(`Auto creating tsConfig for ESM (${esmTsConfig}) extending (${tsConfig})`);
            await writeFile(esmTsConfig,JSON.stringify({
                "extends":"./tsconfig.lib.json",
                "compilerOptions": {
                    "module": esmModuleType
                }
            },null,4));

        }

        results.push(await (async ()=>{
            const esmOutput=Path.join(outputPath,esmDir);
            console.info(`building ESM - ${esmOutput}`)
            const r=await buildAsync({
                ...tscOptions,
                outputPath:esmOutput,
                tsConfig:esmTsConfig,
                watch:false,
                assets:[]
            },context);

            if(!r.success){
                return r;
            }

            await writeFile(Path.join(esmOutput,'package.json'),JSON.stringify({
                sideEffects:!noSideEffects
            },null,4))

            return r;
        })());
    }

    return {
        success: results.every(r=>r.success),
    };



    // let it=await tscExecutor({
    //     outputPath: 'dist/packages/common/cjs',
    //     main: 'packages/common/src/index.ts',
    //     tsConfig: 'packages/common/tsconfig.lib.json',
    //     assets: [ 'packages/common/*.md' ],
    //     buildableProjectDepsInPackageJsonType: 'peerDependencies',
    //     watch: false,
    //     clean: true,
    //     transformers: [],
    //     updateBuildableProjectDepsInPackageJson: true
    // },context);


}

interface BuildResult
{
    success:boolean;
    outputs:string[];
}
const buildAsync=async (options:ExecutorOptions,context:ExecutorContext):Promise<BuildResult>=>{
    const outputs:string[]=[];

    try{
        const it=await tscExecutor(options,context);

        for await (const iter of it)
        {
            if(!iter.success){
                return {
                    success:false,
                    outputs,
                }
            }
            outputs.push(iter.outfile);
        }

        return {
            success:true,
            outputs,
        };
    }catch(ex){
        console.error('tscExecutor failed',ex);
        return {
            success:false,
            outputs,
        }
    }
}

const existsAsync=async (path:string)=>{
    try{
        await access(path);
        return true;
    }catch{
        return false;
    }
}
