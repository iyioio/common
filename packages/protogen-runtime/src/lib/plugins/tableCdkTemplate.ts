export interface TableNameParamNamePair
{
    name:string;
    paramName:string;
}

export const tableCdkTemplate=(constructName:string,tables:TableNameParamNamePair[],importMap:Record<string,string>)=>{

    const imports:string[]=[];
    for(let i=0;i<tables.length;i++){
        const t=tables[i];
        imports.push(`import { ${t.name} as _table${i}} from '${importMap[t.name]}';`);
        imports.push(`import { ${t.paramName} as _tableParam${i}} from '${importMap[t.paramName]}';`);
    }

    return `import { TableBuilder, TableInfo, ManagedProps } from "@iyio/cdk-common";
import { Construct } from "constructs";
${imports.join('\n')}

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(tables:TableInfo[])=>TableInfo[];
}

export class ${constructName} extends TableBuilder
{

    public constructor(scope:Construct,name:string,{
        transform,
        ...props
    }:${constructName}Props={}){

        super(scope,name,{...props,tables:transform?transform(getTables()):getTables()});

    }

}

const getTables=():TableInfo[]=>[${tables.map((_,i)=>`
    {
        tableDescription:_table${i},
        arnParam:_tableParam${i},
        grantAccess:true,
    }`).join(',')}];

`
}



