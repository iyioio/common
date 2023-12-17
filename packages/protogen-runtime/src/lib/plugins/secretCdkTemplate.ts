import type { SecretInfo } from "@iyio/cdk-common";

export type SecretInfoTemplate=Omit<SecretInfo,'arnParam'> & {
    arnParam:string;
}

export const secretCdkTemplate=(constructName:string,infos:SecretInfoTemplate[],importMap:Record<string,string>)=>{

    const imports:string[]=[];
    for(let i=0;i<infos.length;i++){
        const t=infos[i];
        if(!t){
            continue;
        }
        imports.push(`import { ${t.arnParam} as _param${i}} from '${importMap[t.arnParam]}';`);
    }


    return `import { Construct } from "constructs";
import { SecretBuilder, SecretInfo, ManagedProps } from "@iyio/cdk-common";
${imports.join('\n')}

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(secretInfos:SecretInfo[])=>SecretInfo[];
}

export class ${constructName} extends SecretBuilder
{

    public constructor(scope:Construct,name:string,{
        transform,
        ...props
    }:${constructName}Props={}){

        super(scope,name,{...props,secrets:transform?transform(getInfo()):getInfo()});

    }

}

const getInfo=():SecretInfo[]=>[
${
    infos.map((info,i)=>`    {
        name:${JSON.stringify(info.name)},
        arnParam:_param${i},
        grantAccess:true,
    }`)
    .join(',\n')
}
];

`
}

