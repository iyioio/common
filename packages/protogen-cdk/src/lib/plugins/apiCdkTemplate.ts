import type { ApiInfo } from "@iyio/cdk-common";

export interface ApiInfoTemplate extends Omit<ApiInfo,'urlParam'|'domainParam'|'defaultDomainParam'>
{
    urlParam?:string;
    domainParam?:string;
    defaultDomainParam?:string;
}

export const apiCdkTemplate=(constructName:string,infos:ApiInfoTemplate[],importMap:Record<string,string>)=>{

    const imports:string[]=[];

    for(let i=0;i<infos.length;i++){
        const info=infos[i];
        if(!info){
            continue;
        }
        if(info.urlParam){
            imports.push(`import { ${info.urlParam} as _paramUrl${i}} from '${importMap[info.urlParam]}';`);
        }
        if(info.domainParam){
            imports.push(`import { ${info.domainParam} as _paramDomain${i}} from '${importMap[info.domainParam]}';`);
        }
        if(info.defaultDomainParam){
            imports.push(`import { ${info.defaultDomainParam} as _paramDefaultDomain${i}} from '${importMap[info.defaultDomainParam]}';`);
        }
    }

    return `import { Construct } from "constructs";
import { ApiBuilder, ApiInfo, ManagedProps } from "@iyio/cdk-common";
${imports.join('\n')}

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(queues:ApiInfo[])=>ApiInfo[];
}

export class ${constructName} extends ApiBuilder
{

    public constructor(scope:Construct,name:string,props:${constructName}Props){

        super(scope,name,{
            managed:props.managed,
            apis:props.transform?props.transform(getInfos()):getInfos()
        });

    }

}

const getInfos=():ApiInfo[]=>[${infos.map((b,i)=>JSON.stringify(b,null,4)
    .replace(/([\n\r]\s*)"urlParam".*/,(_,space)=>`${space}"urlParam":${b.urlParam?'_paramUrl'+i:'undefined'},`)
    .replace(/([\n\r]\s*)"defaultDomainParam".*/,(_,space)=>`${space}"defaultDomainParam":${b.defaultDomainParam?'_paramDefaultDomain'+i:'undefined'},`)
    .replace(/([\n\r]\s*)"domainParam".*/,(_,space)=>`${space}"domainParam":${b.domainParam?'_paramDomain'+i:'undefined'},`)
    ).join(',\n')}
];`
}

