import { readCachedProjectGraph } from '@nrwl/devkit';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as Path from 'path';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { enumProjects } from './enum-projects.mjs';

const deps=[];
const devDeps=[];

enumProjects({publicOnly:true},({name,project,pkg})=>{

    if(!project.data?.targets?.publish){
        return;
    }

    if(pkg.forDev){
        devDeps.push(`${pkg.name}@${pkg.version}`);
    }else{
        deps.push(`${pkg.name}@${pkg.version}`);
    }

});

if(devDeps.length){
    console.log(`npm i ${devDeps.join(' ')} --save-dev`);
}
if(deps.length){
    console.log(`npm i ${deps.join(' ')}`);
}
