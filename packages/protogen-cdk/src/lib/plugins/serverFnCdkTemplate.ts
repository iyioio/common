import type { FnInfo } from "@iyio/cdk-common";

export type FnInfoTemplate=Omit<FnInfo,'arnParam'|'urlParam'> & {
    arnParam:string;
    urlParam?:string;
}

export const serverFnCdkTemplate=(constructName:string,infos:FnInfoTemplate[],importMap:Record<string,string>)=>{

    const imports:string[]=[];
    for(let i=0;i<infos.length;i++){
        const t=infos[i];
        if(!t){
            continue;
        }
        imports.push(`import { ${t.arnParam} as _fnParam${i}} from '${importMap[t.arnParam]}';`);
        if(t.urlParam){
            imports.push(`import { ${t.urlParam} as _fnUrlParam${i}} from '${importMap[t.urlParam]}';`);
        }
    }


    return `import { Construct } from "constructs";
import { FnsBuilder, FnInfo, ManagedProps } from "@iyio/cdk-common";
${imports.join('\n')}

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(fnInfos:FnInfo[])=>FnInfo[];
}

export class ${constructName} extends FnsBuilder
{

    public constructor(scope:Construct,name:string,{
        transform,
        ...props
    }:${constructName}Props={}){

        super(scope,name,{...props,fnsInfo:transform?transform(getFnsInfo()):getFnsInfo()});

    }

}

const getFnsInfo=():FnInfo[]=>[
${
    infos.map((info,i)=>`    {
        name:${JSON.stringify(info.name)},
        arnParam:_fnParam${i},${info.urlParam?`
        urlParam:_fnUrlParam${i},`:''}
        grantAccess:true,
        accessRequests:${JSON.stringify(info.accessRequests??[])},${info.grantAccessRequests?`
        grantAccessRequests:${JSON.stringify(info.grantAccessRequests)},`:''}${info.noPassiveAccess?`
        noPassiveAccess:true,`:''}
        createProps:${JSON.stringify(info.createProps)},${info.siteSources?`
        siteSources:${JSON.stringify(info.siteSources)},`:''}
    }`)
    .join(',\n')
}
];

`
}

