import { HashMap, getObjKeyCount, joinPaths } from "@iyio/common";
import { ProtoOutput } from "./protogen-pipeline-types";

export const protoLabelOutputLines=(
    lines:string[],
    label:string,
    startIndex:number=0,
    end:number=lines.length)=>
{
    let maxLength=0;
    for(let i=startIndex;i<end;i++){
        if(lines[i].length>maxLength){
            maxLength=lines[i].length;
        }
    }

    maxLength+=4;
    for(let i=startIndex;i<end;i++){
        lines[i]+=' '.repeat(maxLength-lines[i].length)+'// <<';
        if(i===startIndex){
            lines[i]+=' proto '+label
        }
    }

}

export type ProtoSourceCodeMerger=(options:ProtoMergeSourceCodeOptions)=>string[];

export interface ProtoMergeSourceCodeOptions
{
    overwriting:string|string[];
    existing:string|string[];
    mergeSections?:(existing:ProtoCodeSection,overwriting:ProtoCodeSection)=>ProtoCodeSection;
    createSectionsConfig?:ProtoCreateCodeSectionsOptions;

}
export const protoMergeSourceCode=({
    overwriting,
    existing,
    mergeSections,
    createSectionsConfig
}:ProtoMergeSourceCodeOptions):string[]=>{

    if(typeof overwriting === 'string'){
        overwriting=overwriting.split('\n');
    }

    if(typeof existing === 'string'){
        existing=existing.split('\n');
    }

    if(existing.length<=1 && !existing[0]?.trim()){
        return overwriting;
    }

    const oSections=protoCreateCodeSections(overwriting,createSectionsConfig);
    const existingSections=protoCreateCodeSections(existing,createSectionsConfig);

    for(let i=0;i<existingSections.length;i++){
        const section=existingSections[i];
        if(!section.name){
            continue;
        }
        const match=oSections.find(s=>s.name===section.name);
        if(match){
            existingSections[i]=mergeSections?mergeSections(section,match):match;
        }
    }

    const output:string[]=[];
    for(const section of existingSections){
        for(const line of section.lines){
            output.push(line);
        }
    }

    return output;
}


export interface ProtoCreateCodeSectionsOptions
{
    sectionRegex:RegExp;
    sectionContentIndex?:number;

    nameReg?:RegExp;
    nameIndex?:number;
    getName?:(sectionContent:string)=>string;
    defaultName?:string;

    takeCommentPrefix?:boolean;

    debug?:boolean;

}
export const protoCreateCodeSections=(code:string[],{
    sectionRegex,
    sectionContentIndex=0,
    nameReg,
    nameIndex=0,
    getName,
    defaultName,
    takeCommentPrefix,
    debug
}:ProtoCreateCodeSectionsOptions={
    sectionRegex:/\/\/\s*<<(.*)$/,
    sectionContentIndex:1,
    nameReg:/proto\s+(.*)/,
    nameIndex:1,
    takeCommentPrefix:true,
}):ProtoCodeSection[]=>{

    const sections:ProtoCodeSection[]=[];

    let section:ProtoCodeSection={
        name:'',
        lines:[]
    }

    const pushSection=()=>{
        if(!section.lines.length){
            return;
        }
        const lastSection=sections[sections.length-1];
        if(takeCommentPrefix && lastSection && section.name && !lastSection.name){
            let startCommentIndex:number|null=null;
            for(let i=lastSection.lines.length-1;i>=0;i--){
                const line=lastSection.lines[i];
                if(!line.trim() || /^\s*\*/.test(line)){
                    continue;
                }
                if(/^\s*\/\*\*/.test(line)){
                    startCommentIndex=i;
                    break;
                }

            }
            if(startCommentIndex!==null){
                for(let i=lastSection.lines.length-1;i>=startCommentIndex;i--){
                    section.lines.unshift(lastSection.lines.pop()??'')
                }
            }
            if(!lastSection.lines.length){
                sections.pop();
            }
        }
        sections.push(section);
    }

    for(const line of code){
        const match=sectionRegex.exec(line);

        if(match){
            let name=(
                getName?.(match[sectionContentIndex])??
                nameReg?.exec(match[sectionContentIndex]?.trim()??'')?.[nameIndex]??
                defaultName
            );
            if(name && name!==section.name){
                pushSection();
                if(sections.some(s=>s.name===name)){
                    let i=2;
                    while(sections.some(s=>s.name===(name??'')+i)){
                        i++;
                    }
                    name+=i;
                }
                section={
                    name,
                    lines:[]
                }
            }
        }else if(section.name){
            pushSection();
            section={
                name:'',
                lines:[]
            }
        }
        section.lines.push(line);
    }

    pushSection();

    if(debug && sections.some(s=>s.name)){
        console.debug('code sections',sections);
    }

    return sections;
}

export interface ProtoCodeSection
{
    name:string;
    lines:string[];
}

export const protoMergeTsImports=({
    createSectionsConfig=defaultMergeTsImportsSectionConfig,
    mergeSections=defaultMergeTsImportsMerger,
    ...props
}:ProtoMergeSourceCodeOptions):string[]=>{

    return protoMergeSourceCode({
        createSectionsConfig,
        mergeSections,
        ...props
    })
}

const importReg=/^import\s+\{(.*?)\}\s+from\s+['"](.*?)['"]/
const defaultMergeTsImportsSectionConfig:ProtoCreateCodeSectionsOptions={
    sectionRegex:importReg,
    defaultName:'import',
}

const defaultMergeTsImportsMerger=(existing:ProtoCodeSection,overwriting:ProtoCodeSection):ProtoCodeSection=>{

    const map:HashMap<string[]>={};
    const map2:HashMap<string[]>={};

    addImportsToMap(existing.lines,map);
    addImportsToMap(overwriting.lines,map2);


    if(compareImportMaps(map,map2)){
        return {
            name:existing.name,
            lines:[...existing.lines],
        };
    }

    mergeImportMaps(map,map2);

    return {
        name:existing.name,
        lines:Object.keys(map).map(k=>`import { ${map[k].join(', ')} } from '${k}';`),
    }
}

const compareImportMaps=(a:Record<string,string[]>, b:Record<string,string[]>):boolean=>{

    let n=0;

    for(const e in a){
        n++;
        const aAry=a[e];
        const bAry=b[e];
        if(!bAry || aAry.length!==bAry.length){
            return false;
        }

        for(const s of aAry){
            if(!bAry.includes(s)){
                return false;
            }
        }
    }

    return n===getObjKeyCount(b);
}

const mergeImportMaps=(a:Record<string,string[]>, b:Record<string,string[]>):void=>{
    for(const e in b){
        const bAry=b[e];
        const aAry=a[e];
        if(!aAry){
            a[e]=bAry;
        }else{
            for(const s of bAry){
                if(!aAry.includes(s)){
                    aAry.push(s)
                }
            }
        }
    }
}

const addImportsToMap=(code:string[],map:HashMap<string[]>)=>{
    for(const line of code){
        const match=importReg.exec(line);
        if(!match){
            continue;
        }

        const packageName=match[2].trim();
        let pkg=map[packageName];
        if(!pkg){
            map[packageName]=pkg=[];
        }
        const names=match[1].split(',');
        for(const n of names){
            const name=n.trim();
            if(name && !pkg.includes(name)){
                pkg.push(name);
            }
        }
    }
}

export interface ProtoFileMapToOutputOptions
{
    targetDir:string;
    outputDefaults?:Partial<ProtoOutput>
}
export const protoFileMapToOutput=(map:Record<string,string>,{
    targetDir,
    outputDefaults={}
}:ProtoFileMapToOutputOptions):ProtoOutput[]=>{

    const outputs:ProtoOutput[]=[];
    for(const name in map){
        outputs.push({
            ...outputDefaults,
            path:joinPaths(targetDir,name),
            content:map[name],
        })
    }
    return outputs;
}
