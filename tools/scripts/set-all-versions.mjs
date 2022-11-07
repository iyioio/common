import { readCachedProjectGraph } from '@nrwl/devkit';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as Path from 'path';
import chalk from 'chalk';
import { enumProjects } from './enum-projects.mjs'

const [, , version] = process.argv;

const graph = readCachedProjectGraph();

const addVersions=(a,b)=>{
    const aAry=a.split('.').map(n=>Number(n));
    const bAry=b.split('.').map(n=>Number(n));
    return `${(aAry[0]??0)+(bAry[0]??0)}.${(aAry[1]??0)+(bAry[1]??0)}.${(aAry[2]??0)+(bAry[2]??0)}`
}

enumProjects({publicOnly:true},({name,version:v,pkg,packageJson})=>{
    if(version.startsWith('+')){
        pkg.version=addVersions(v,version.substring(1));
    }else{
        pkg.version=version;
    }

    console.log(`${name} ${v} -> ${pkg.version}`);

    writeFileSync(packageJson,JSON.stringify(pkg,null,4)+'\n');
})

// for(const e in graph.nodes){

//     const project=graph.nodes[e];

//     const root=project.data.root;

//     if(!root){
//         console.warn(`no root for ${e}`);
//         continue;
//     }

//     const packageJson=Path.join(root,'package.json');

//     if(!existsSync(packageJson)){
//         continue;
//     }

//     const pkg=JSON.parse(readFileSync(packageJson).toString());

//     if(pkg.private){
//         console.log(`Skipping private package ${e}`);
//         continue;
//     }

//     if(!pkg.version){
//         pkg.version='0.0.1';
//     }

//     const preVersion=pkg.version;
//     if(version.startsWith('+')){
//         pkg.version=addVersions(pkg.version,version.substring(1));
//     }else{
//         pkg.version=version;
//     }

//     console.log(`${e} ${preVersion} -> ${pkg.version}`);

//     writeFileSync(packageJson,JSON.stringify(pkg,null,4)+'\n');

// }
