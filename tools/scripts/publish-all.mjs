import { readCachedProjectGraph } from '@nrwl/devkit';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as Path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { enumProjects } from './enum-projects.mjs';

const dryRun=process.argv.includes('--dry-run')

const publishMap={};

enumProjects({publicOnly:true},({name,project,pkg})=>{

    if(!project.data?.targets?.publish){
        return;
    }

    publishMap[name]=pkg;

});


(async ()=>{
    for(const name in publishMap){

        const pkg=publishMap[name];

        console.log(`https://registry.npmjs.org/${pkg.name}`)
        const r=await fetch(`https://registry.npmjs.org/${pkg.name}`);
        if(!r.ok){
            if(r.status===404){
                continue;
            }
            throw new Error(`unable to get npm package for ${pkg.name}`)
        }

        const info=await r.json();

        if(info.versions[pkg.version]){
            delete publishMap[name];
            console.log(`${pkg.name}@${pkg.version} already published`);
            continue;
        }

        const distTags=info['dist-tags']
        if(distTags){
            for(const e in distTags){
                if(distTags[e]===pkg.version){
                    delete publishMap[name];
                    console.log(`${pkg.name}@${pkg.version} already published`);
                    continue;
                }
            }
        }
    }

    for(const name in publishMap){

        const pkg=publishMap[name];
        console.log(`Publishing ${pkg.name}@${pkg.version}`);
        console.log(`npx nx run ${name}:publish --ver ${pkg.version} --tag latest`);
        if(dryRun){
            console.log(`Dry run, skipping real publish`)
        }else{
            execSync(`npx nx run ${name}:publish --ver ${pkg.version} --tag latest`);
        }

    }

    console.log('done')
})();
