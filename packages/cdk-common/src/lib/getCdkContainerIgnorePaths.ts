import { getDirectoryName, getFileName, joinPaths } from "@iyio/common";
import { DockerIgnore, dockerIgnore, isDirSync, pathExistsSync } from "@iyio/node-common";
import { readFileSync, readdirSync } from "fs";

export const defaultContainerIgnoreOverrides=['node_modules','venv','__pycache__','bin','cdk.out','.git','.nx','.next'];
Object.freeze(defaultContainerIgnoreOverrides);

/**
 * Returns an array of paths that should be ignored based on the .dockerignore file of the given
 * docker file. The returned array is compatible with CDKs image exclusion, git ignore and docker ignore files.
 * @note Due to the way CDK handles the default docker ignore file you should use a name other than Dockerfile
 *       For you docker file. Otherwise docker will load the default docker ignore file and override
 *       the values returned getCdkContainerIgnorePaths.
 * @param dockerFilePath Docker file to search dockerignore files for
 * @param contextDir Build context directory. default = directory of dockerfile
 * @param ignoreOverrides An array of additional file or folder names to ignore. The paths can not have slashes.
 *                        default = ['node_modules','venv','__pycache__','bin','cdk.out','.git','.nx','.next']
 * @returns
 */
export const getCdkContainerIgnorePaths=(
    dockerFilePath:string,
    contextDir=getDirectoryName(dockerFilePath),
    ignoreOverrides=defaultContainerIgnoreOverrides
):string[]=>{


    contextDir=getDirectoryName(joinPaths(contextDir,dockerFilePath));

    const ignoreRules:string[]=[];

    const addPath=(path:string)=>{
        if(pathExistsSync(path)){
            const lines=readFileSync(path).toString().split('\n').map(l=>l.trim()).filter(l=>l && !l.startsWith('#'));
            ignoreRules.push(...lines);
        }
    }

    let ignoreFile=joinPaths(contextDir,'.dockerignore');
    addPath(ignoreFile);

    const dockerFileName=getFileName(dockerFilePath);
    if(dockerFileName.includes('.')){
        ignoreFile=dockerFileName.split('.')[0]+'.dockerignore';
        addPath(ignoreFile);
    }

    ignoreRules.push(`!${dockerFilePath.startsWith('/')?dockerFilePath.substring(1):''}${dockerFilePath}`);

    const ig=dockerIgnore();
    ig.add(ignoreRules);

    const {ignore}=scanContainerPaths(ig,'../..','',ignoreOverrides);

    return ignore;

}

export const normalizeDockerIgnoreFile=(
    dockerIgnorePath:string,
    contextDir=getDirectoryName(dockerIgnorePath),
    ignoreOverrides=defaultContainerIgnoreOverrides
):string[]=>{
    return normalizeDockerIgnoreFileContent(readFileSync(dockerIgnorePath).toString(),contextDir,ignoreOverrides);
}

export const normalizeDockerIgnoreFileContent=(
    content:string,
    contextDir='.',
    ignoreOverrides=defaultContainerIgnoreOverrides
):string[]=>{
    const ignoreRules=content.split('\n').map(l=>l.trim()).filter(l=>l && !l.startsWith('#'));
    const ig=dockerIgnore();
    ig.add(ignoreRules);

    const {ignore}=scanContainerPaths(ig,contextDir,'',ignoreOverrides);

    return ignore;
}

const scanContainerPaths=(
    ig:DockerIgnore,
    baseDir:string,
    dir:string,
    ignoreOverrides:string[]
):{ignore:string[],allIgnored:boolean}=>{

    const fullDir=joinPaths(baseDir,dir);
    const items=readdirSync(fullDir);
    let allIgnored=true;
    const ignore:string[]=[];
    for(const p of items){
        const path=dir?joinPaths(dir,p):p;
        if(ignoreOverrides.includes(p)){
            ignore.push(path);
            continue;
        }


        if(ig.ignores(path)){
            const isDir=isDirSync(joinPaths(baseDir,path));
            if(isDir){
                const r=scanContainerPaths(ig,baseDir,path,ignoreOverrides);
                if(r.allIgnored){
                    ignore.push(path);
                }else{
                    allIgnored=false;
                    ignore.push(...r.ignore);
                }
            }else{
                ignore.push(path);
            }

        }else{
            allIgnored=false;
            continue;
        }
    }

    return {
        ignore,
        allIgnored,
    }
}
