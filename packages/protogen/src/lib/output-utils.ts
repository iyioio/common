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

export interface ProtoMergeSourceCodeOptions
{
    overwriting:string|string[];
    existing:string|string[];

}
export const protoMergeSourceCode=({
    overwriting,
    existing
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

    const oSections=createSections(overwriting,true);
    const existingSections=createSections(existing,false);

    for(let i=0;i<existingSections.length;i++){
        const section=existingSections[i];
        const match=oSections.find(s=>s.name===section.name);
        if(match){
            existingSections[i]=match;
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

const createSections=(code:string[],discardUnnamed:boolean):CodeSection[]=>{

    const sections:CodeSection[]=[];

    let section:CodeSection={
        name:'',
        lines:[]
    }

    for(const line of code){
        const match=/\/\/\s*<<(.*)$/.exec(line);

        if(match){
            let name=/proto\s+(.*)/.exec(match[1].trim())?.[1];
            if(name){
                if(section.lines.length){
                    sections.push(section);
                }
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
            if(section.lines.length){
                sections.push(section);
            }
            section={
                name:'',
                lines:[]
            }
        }
        if(!discardUnnamed || section.name){
            section.lines.push(line);
        }
    }

    if(section.lines.length){
        sections.push(section);
    }

    return sections;
}

interface CodeSection
{
    name:string;
    lines:string[];
}


// todo
// export const protoFormatTsImports=(code:string|string[]):string[]
