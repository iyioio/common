import type { QueueInfo } from "@iyio/cdk-common";

export interface QueueInfoTemplate extends Omit<QueueInfo,'arnParam'>
{
    arnParam?:string;
}

export const queueCdkTemplate=(constructName:string,queues:QueueInfoTemplate[],importMap:Record<string,string>)=>{

    const imports:string[]=[];

    for(let i=0;i<queues.length;i++){
        const b=queues[i];
        if(!b){
            continue;
        }
        if(b.arnParam){
            imports.push(`import { ${b.arnParam} as _param${i}} from '${importMap[b.arnParam]}';`);
        }
    }

    return `import { Construct } from "constructs";
import { QueueBuilder, QueueInfo, ManagedProps } from "@iyio/cdk-common";
${imports.join('\n')}

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(queues:QueueInfo[])=>QueueInfo[];
}

export class ${constructName} extends QueueBuilder
{

    public constructor(scope:Construct,name:string,props:${constructName}Props={}){

        super(scope,name,{
            managed:props.managed,
            queues:props.transform?props.transform(getQueues()):getQueues()
        });

    }

}

const getQueues=():QueueInfo[]=>[${queues.map((b,i)=>JSON.stringify(b,null,4)
    .replace(/([\n\r]\s*)"arnParam".*/,(_,space)=>`${space}"arnParam":${b.arnParam?'_param'+i+',':'undefined'}`)).join(',\n')}
];`
}

