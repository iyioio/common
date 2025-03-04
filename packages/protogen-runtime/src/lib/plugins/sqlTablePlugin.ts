import { joinPaths } from "@iyio/common";
import { ProtoNode, ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";
import { generateProtoTable } from "../protogen-table-generator";

const SqlTableConfig=z.object(
{
    /**
     * @default .sqlTablePackage
     */
    sqlTablePath:z.string().optional(),

    /**
     * @default "sql-tables"
     */
    sqlTablePackage:z.string().optional(),

    /**
     * @default "sql-tables.ts"
     */
    sqlTableFilename:z.string().optional(),

    /**
     * @default "sql-tables-index.ts"
     */
    sqlTableIndexFilename:z.string().optional(),

    /**
     * The sql data source or dialect used by prisma
     * @default "postgresql"
     */
    sqlTableDialect:z.string().optional(),

    /**
     * Path to the Prisma scheme file
     * @default "schema.prisma"
     */
    sqlTableSchemaPath:z.string().optional(),

    /**
     * @default '@iyio/common'
     */
    dataTableDescriptionPackage:z.string().optional(),

    /**
     * @default 'allSqlTables'
     */
    allSqlTableArrayName:z.string().optional(),

    /**
     * A comma separated list of properties that should be converted as long strings.
     */
    longStringProps:z.string().optional(),
})

export const sqlTablePlugin:ProtoPipelineConfigurablePlugin<typeof SqlTableConfig>=
{
    configScheme:SqlTableConfig,
    generate:async (context,{
        sqlTablePackage='sql-tables',
        sqlTableFilename='sql-tables.ts',
        sqlTablePath=sqlTablePackage,
        sqlTableIndexFilename='sql-tables-index.ts',
        sqlTableDialect='postgresql',
        sqlTableSchemaPath='schema.prisma',
        dataTableDescriptionPackage='@iyio/common',
        allSqlTableArrayName='allSqlTables',
        longStringProps,
        ...tsConfig
    })=>{

        const result=await generateProtoTable(context,{
            pluginName:'sqlTablePlugin',
            supportedTypes:['sqlTable'],
            paramNameSuffix:'Sql',
            tableType:'sql',
            tablePath:sqlTablePath,
            tablePackage:sqlTablePackage,
            tableFilename:sqlTableFilename,
            tableIndexFilename:sqlTableIndexFilename,
            dataTableDescriptionPackage,
            allTableArrayName:allSqlTableArrayName,
            getColInfo:(node)=>{
                const {type}=getSqlType(node,context.nodes);
                return type?{type}:undefined;
            },
            ...tsConfig,
        })

        if(!result){
            return;
        }

        const schemeOutput:string[]=[];

        schemeOutput.unshift(`
generator client {
provider = "prisma-client-js"
}

datasource db {
provider = "${sqlTableDialect}"
url      = "localhost"
}
`)

        const longProps=longStringProps?longStringProps.split(',').map(s=>s.trim()):[];

        for(const table of result.tables){
            const node=table.node;
            const name=node.name;
            schemeOutput.push(`model ${name} {`);
            if(node.children){
                for(const prop in node.children){
                    const child=node.children[prop];
                    if(!child || child.special || child.isContent){
                        continue;
                    }

                    const {type,custom}=getSqlType(child,context.nodes);
                    const isJson=type==='Json';
                    const maxLength=getSqlMaxLength(child,longProps);
                    const defaultValue=child.children?.['default']?.value;

                    if(type){

                        schemeOutput.push(`${context.tab}${prop} ${type}${
                           ( child.types[0]?.isArray && !custom && !isJson)?'[]':child.optional?'?':''
                        }${
                            prop===table.primaryKey?type==='Int'?' @id @default(autoincrement())':' @id':''
                        }${
                            type==='String' && maxLength!==null?` @db.VarChar(${maxLength})`:''
                        }${
                            child.children?.['unique']?' @unique':''
                        }${
                            defaultValue?` @default(${defaultValue})`:''
                        }`)

                        if(child.refType){
                            const refTable=result.tables.find(t=>t.name===child.refType?.type);
                            if(refTable){
                                const refName=(prop.endsWith('Id') && prop.length>2)?prop.substring(0,prop.length-2):prop+'Ref';
                                schemeOutput.push(`${context.tab}${refName} ${child.refType.type}${
                                    child.optional?'?':''
                                } @relation(fields:[${[prop]}],references:[${refTable.primaryKey}])`)
                            }
                        }
                    }else{
                        const refTable=result.tables.find(t=>t.name===child.type);
                        if(refTable){
                            schemeOutput.push(`${context.tab}${prop} ${child.type}${
                                child.types[0]?.isArray?'[]':child.optional?'?':''
                            }`)
                        }
                    }
                }
            }
            if(table.indexes){
                for(const index of table.indexes){
                    schemeOutput.push(`\n${context.tab}// ${index.name} - index`);
                    schemeOutput.push(`${context.tab}@@${index.unique?'unique':'index'}([${index.primary}${index.sort?','+index.sort:''}])`);
                }
            }

            schemeOutput.push('}\n');
        }

        context.outputs.push({
            path:joinPaths(result.path,sqlTableSchemaPath),
            content:schemeOutput.join('\n'),
            metadata:{sqlTableSchemaPath:true}
        })

    }
}


const sqlTypeMap:Record<string,string>={
    string:'String',
    int:'Int',
    time:'BigInt',
    bool:'Boolean',
    boolean:'Boolean',
    number:'Float',
    bigInt:'BigInt',
    map:'Json',
    any:'Json',
    stringMap:'Json',
    numberMap:'Json',
    booleanMap:'Json',
    dateMap:'Json',
    bigIntMap:'Json',
    union:'String',
    enum:'Int',
}

const getSqlType=(node:ProtoNode,allNodes?:ProtoNode[]):{type:string|undefined,custom?:boolean}=>{

    let dbType=(node.children?.['$sqlType']?.value??node.children?.['$dbType']?.value)?.trim();
    if(dbType){
        const len=(node.children?.['$sqlLength']?.value??node.children?.['$dbLength']?.value??node.children?.['max']?.value)?.trim();
        if(len){
            dbType+=`(${len})`
        }
        if(dbType.startsWith('!')){
            return {type:`Unsupported("${dbType.substring(1)}")`,custom:true}
        }else{
            return {type:dbType};
        }
    }
    const type=(node.types[0]?.mapType || node.children?.['json'])?'Json':sqlTypeMap[node.type];
    if(type || !allNodes){
        return {type,custom:false};
    }

    const refType=node.types[0];
    if(!refType?.isRefType){
        return {type:undefined};
    }

    const t=refType.path[0];
    if(!t){
        return {type:undefined};
    }

    const r=allNodes.find(n=>n.address===t);
    if(!r){
        return {type:undefined};
    }

    return getSqlType(r);

}

const getSqlMaxLength=(node:ProtoNode,longProps:string[]):number|null=>{
    const maxChild=node.children?.['max'];
    if(maxChild){
        const n=parseNum(maxChild.value);
        if(n!==undefined){
            return n;
        }
    }
    if(longProps.includes(node.name) || parseBool(node.children?.['long']?.value,false)){
        return null;
    }else{
        return 255;
    }
}

const parseNum=(str:string|null|undefined)=>{
    if(!str){
        return undefined;
    }
    const n=Number(str);
    return isFinite(n)?n:undefined;
}

const parseBool=(value:string|undefined,defaultValue:boolean):boolean=>{
    if(!value){
        return defaultValue;
    }
    value=value.trim();
    if(!value){
        return defaultValue;
    }
    return Boolean(value);
}
