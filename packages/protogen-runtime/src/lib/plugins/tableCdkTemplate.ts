
export const tableCdkTemplate=(constructName:string,tables:string[],importMap:Record<string,string>)=>{

    const imports:string[]=[];
    for(let i=0;i<tables.length;i++){
        const t=tables[i];
        imports.push(`import { ${t} as _table${i}} from '${importMap[t]}';`);
    }

    return `import { TableBuilder } from "@iyio/cdk-common";
import { DataTableDescription } from "@iyio/common";
import { Construct } from "constructs";
${imports.join('\n')}

export interface TablesProps
{
    transformTables?:(tables:DataTableDescription[])=>DataTableDescription[];
}

export class ${constructName} extends TableBuilder
{

    public readonly tables:DataTableDescription[];

    public constructor(scope:Construct,name:string,{
        transformTables
    }:TablesProps={}){

        let tables:DataTableDescription[]=[${tables.map((_,i)=>'_table'+i).join(',')}];

        super(scope,name,{tables:tables=(transformTables?transformTables(tables):tables)});

        this.tables=tables;

    }

}
`
}



