import type { ContainerInfo } from "@iyio/cdk-common";

export interface ContainerInfoTemplate extends Omit<ContainerInfo,'serviceArnParam'|'taskArnParam'>
{
    serviceArnParam?:string;
    taskArnParam?:string;
}

export const containerCdkTemplate=(constructName:string,infos:ContainerInfoTemplate[],importMap:Record<string,string>)=>{

    const imports:string[]=[];

    for(let i=0;i<infos.length;i++){
        const info=infos[i];
        if(!info){
            continue;
        }
        if(info.serviceArnParam){
            imports.push(`import { ${info.serviceArnParam} as _serviceArn${i}} from '${importMap[info.serviceArnParam]}';`);
        }
        if(info.taskArnParam){
            imports.push(`import { ${info.taskArnParam} as _paramTask${i}} from '${importMap[info.taskArnParam]}';`);
        }
    }

    return `import { Construct } from "constructs";
import { ContainerBuilder, ContainerInfo, ManagedProps } from "@iyio/cdk-common";
${imports.join('\n')}

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(queues:ContainerInfo[])=>ContainerInfo[];
}

export class ${constructName} extends ContainerBuilder
{

    public constructor(scope:Construct,name:string,props:${constructName}Props={}){

        super(scope,name,{
            managed:props.managed,
            containers:props.transform?props.transform(getInfos()):getInfos()
        });

    }

}

const getInfos=():ContainerInfo[]=>[${infos.map((b,i)=>JSON.stringify(b,null,4)
    .replace(/([\n\r]\s*)"serviceArnParam".*/,(_,space)=>`${space}"serviceArnParam":${b.serviceArnParam?'_serviceArn'+i:'undefined'},`)
    .replace(/([\n\r]\s*)"taskArnParam".*/,(_,space)=>`${space}"taskArnParam":${b.taskArnParam?'_paramTask'+i:'undefined'},`)
    ).join(',\n')}
];`
}

