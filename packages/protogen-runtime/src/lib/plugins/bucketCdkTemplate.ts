import type { BucketInfo } from "@iyio/cdk-common";

export interface BucketInfoTemplate extends Omit<BucketInfo,'arnParam'>
{
    arnParam?:string;
}

export const bucketCdkTemplate=(constructName:string,buckets:BucketInfoTemplate[],importMap:Record<string,string>)=>{

    const imports:string[]=[];

    for(let i=0;i<buckets.length;i++){
        const b=buckets[i];
        if(b.arnParam){
            imports.push(`import { ${b.arnParam} as _param${i}} from '${importMap[b.arnParam]}';`);
        }
    }

    return `import { Construct } from "constructs";
import { BucketBuilder, BucketInfo, ManagedProps } from "@iyio/cdk-common";
${imports.join('\n')}

export interface ${constructName}Props
{
    managed?:ManagedProps;
    transform?:(buckets:BucketInfo[])=>BucketInfo[];
}

export class ${constructName} extends BucketBuilder
{

    public constructor(scope:Construct,name:string,props:${constructName}Props={}){

        super(scope,name,{
            managed:props.managed,
            buckets:props.transform?props.transform(getBuckets()):getBuckets()
        });

    }

}

const getBuckets=():BucketInfo[]=>[${buckets.map((b,i)=>`
    {
        name:${JSON.stringify(b.name)},
        public:${b.public?'true':'false'},
        enableCors:${b.enableCors?'true':'false'},
        arnParam:${b.arnParam?'_param'+i:'undefined'},${b.mountPaths?`
        mountPaths:${JSON.stringify(b.mountPaths)},`:''}
        grantAccess:true,${b.versioned?`
        versioned:true,`:''}
    },`).join('')}
];`
}

