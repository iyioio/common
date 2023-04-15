import type { FnInfo } from "@iyio/cdk-common";

export type FnInfoTemplate=Omit<FnInfo,'arnParam'> & {
    arnParam:string;
}

export const serverFnCdkTemplate=(constructName:string,infos:FnInfoTemplate[],importMap:Record<string,string>)=>{

    const imports:string[]=[];
    for(let i=0;i<infos.length;i++){
        const t=infos[i];
        imports.push(`import { ${t.arnParam} as _fnParam${i}} from '${importMap[t.arnParam]}';`);
    }


    return `import { Construct } from "constructs";
import { FnsBuilder, FnInfo, ParamOutput } from "@iyio/cdk-common";
${imports.join('\n')}

export interface ${constructName}Props
{
    params?:ParamOutput;
    transform?:(fnInfos:FnInfo[])=>FnInfo[];
}

export class ${constructName} extends FnsBuilder
{

    public constructor(scope:Construct,name:string,{
        transform,
        ...props
    }:${constructName}Props={}){

        super(scope,name,{...props,fnsInfo:transform?transform(fnsInfo):fnsInfo});

    }

}

const fnsInfo:FnInfo[]=[
${
    infos.map((info,i)=>`    {
        name:${JSON.stringify(info.name)},
        arnParam:_fnParam${i},
        grantAccess:true,
        accessRequests:${JSON.stringify(info.accessRequests??[])},
        createProps:${JSON.stringify(info.createProps)},
    }`)
    .join(',\n')
}
];

`
}

