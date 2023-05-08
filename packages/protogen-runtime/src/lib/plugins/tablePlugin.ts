import { HashMap, joinPaths } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, addTsImport, getProtoPluginPackAndPath, protoAddContextParam, protoFormatTsComment, protoGenerateTsIndex, protoGetChildren, protoGetChildrenByName, protoGetParamName, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";
import { SharedTsPluginConfigScheme, getTsSchemeName } from "../sharedTsConfig";
import { TableNameParamNamePair, tableCdkTemplate } from "./tableCdkTemplate";

const notWordRegex=/\W/g;

const TablePluginConfig=z.object(
{
    /**
     * @default .tablePackage
     */
    tablePath:z.string().optional(),

    /**
     * @default "tables.ts"
     */
    tableFilename:z.string().optional(),

    /**
     * @default "tables-index.ts"
     */
    tableIndexFilename:z.string().optional(),


    /**
     * @default "tables"
     */
    tablePackage:z.string().optional(),

    /**
     * If true the tableIdParam of generated tables will be populated and a table-params file will be generated.
     */
    tableUseParamIds:z.boolean().optional(),

    /**
     * @default '@iyio/common'
     */
    dataTableDescriptionPackage:z.string().optional(),

    /**
     * @default 'allTables'
     */
    allTableArrayName:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the
     * tables
     */
    tableCdkConstructFile:z.string().optional(),

    /**
     * @default "Tbls"
     */
    tableCdkConstructClassName:z.string().optional(),



}).merge(SharedTsPluginConfigScheme);

export const tablePlugin:ProtoPipelineConfigurablePlugin<typeof TablePluginConfig>=
{
    configScheme:TablePluginConfig,

    generate:async ({
        log,
        nodes,
        outputs,
        importMap,
        tab,
        packagePaths,
        namespace,
        libStyle,
        paramPackage,
        paramMap
    },{
        tablePath,
        tablePackage='tables',
        tableFilename='tables.ts',
        tableIndexFilename='tables-index.ts',
        tableUseParamIds,
        dataTableDescriptionPackage='@iyio/common',
        allTableArrayName='allTables',
        tableCdkConstructClassName='Tbls',
        tableCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${tableCdkConstructClassName}.ts`:undefined,
        ...tsConfig
    })=>{

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            tablePackage,
            tablePath,
            libStyle,
            {packagePaths,indexFilename:tableIndexFilename}
        );

        const imports:string[]=[];
        const localImportMap:HashMap<string>={};
        const addImport=(im:string,packageName?:string)=>{
            addTsImport(im,packageName,imports,importMap);
        }

        const supported=nodes.filter(node=>node.types.some(t=>t.type==='table'));

        if(supported.length){
            addImport('DataTableDescription',dataTableDescriptionPackage);
            addImport('DataTableIndex',dataTableDescriptionPackage);
        }

        log(`${supported.length} supported node(s)`);

        const out:string[]=[];

        const tableNames:string[]=[];
        const tableInfos:TableNameParamNamePair[]=[];

        for(const node of supported){

            const name=node.name;
            const paramName=protoGetParamName(name+'Table');
            importMap[name+'Table']=packageName;
            importMap[name+'TableIndexMap']=packageName;

            tableNames.push(name+'Table');
            tableInfos.push({name:name+'Table',paramName})

            log(`table - ${name}Table`);

            const props=protoGetChildren(node,false);

            out.push('');
            if(node.comment){
                out.push(protoFormatTsComment(node.comment,''));
            }
            addImport(name);
            out.push(`export const ${name}Table:DataTableDescription<${name}>={`);
            out.push(`${tab}name:${JSON.stringify(name)},`);

            const config=node.children?.['$table']?.children??{};
            let configValue:string|undefined;

            configValue=config['primaryKey']?.value?.replace(notWordRegex,'')||'id';
            out.push(`${tab}primaryKey:${JSON.stringify(configValue)},`);

            if(configValue=config['sortKey']?.value?.replace(notWordRegex,'')){
                out.push(`${tab}sortKey:${JSON.stringify(configValue)},`)
                const sortProp=node.children?.[configValue]?.type??'string';
                out.push(`${tab}sortKeyType:'${sortProp==='string'?'string':'number'}',`)
            }


            if(tableUseParamIds){
                protoAddContextParam(name+'Table',paramPackage,paramMap,importMap);
                addImport(paramName,paramPackage);
                out.push(`${tab}tableIdParam:${paramName},`)
            }


            configValue=config['scheme']?.value??getTsSchemeName(name,tsConfig);

            if(importMap[configValue]){
                addImport(configValue);
                out.push(`${tab}scheme:${configValue},`)
            }

            if(configValue=config['mountPath']?.value){
                out.push(`${tab}mountPath:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['isReadonly']?.value){
                out.push(`${tab}isReadonly:${JSON.stringify(Boolean(configValue))},`)
            }

            if(configValue=config['watchable']?.value?.replace(notWordRegex,'')){
                out.push(`${tab}watchable:${JSON.stringify(Boolean(configValue))},`)
            }

            if(configValue=config['defaultOrderProp']?.value?.replace(notWordRegex,'')){
                out.push(`${tab}defaultOrderProp:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['defaultOrderDesc']?.value?.replace(notWordRegex,'')){
                out.push(`${tab}defaultOrderDesc:${JSON.stringify(Boolean(configValue))},`)
            }

            if(configValue=config['ttlProp']?.value?.replace(notWordRegex,'')??props.find(p=>p.name==='ttl')?.name){
                out.push(`${tab}ttlProp:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['updateVersionProp']?.value?.replace(notWordRegex,'')??props.find(p=>p.name==='uv')?.name){
                out.push(`${tab}updateVersionProp:${JSON.stringify(configValue)},`)
            }

            const indexes=protoGetChildrenByName(node.children?.['$table'],'index',false);
            const indexOut:string[]=[];
            if(indexes.length){
                out.push(`${tab}indexes:[`)
                for(let i=0;i<indexes.length;i++){
                    const index=indexes[i];
                    const indexName=index.value||'index'+i;
                    indexOut.push(`${tab}${JSON.stringify(indexName)}:${name}Table.indexes?.[${i}] as DataTableIndex,`)
                    out.push(`${tab}${tab}{`);
                    out.push(`${tab}${tab}${tab}name:${JSON.stringify(indexName)},`);
                    const primaryProp=index.children?.['primary']?.value?.replace(notWordRegex,'');
                    out.push(`${tab}${tab}${tab}primary:${JSON.stringify(primaryProp??indexName)},`);
                    const sortProp=index.children?.['sort']?.value?.replace(notWordRegex,'');
                    if(sortProp){
                        out.push(`${tab}${tab}${tab}sort:${JSON.stringify(sortProp)},`);
                    }
                    if(index.children?.['includeAll']){
                        out.push(`${tab}${tab}${tab}includeAll:true,`);
                    }
                    const includeProps=protoGetChildrenByName(index.children?.['include'],'prop',false);
                    if(includeProps.length){
                        out.push(`${tab}${tab}${tab}include:[`);
                        for(const incProp of includeProps){
                            out.push(`${tab}${tab}${tab}${tab}${JSON.stringify(incProp.value?.replace(notWordRegex,''))},`);
                        }
                        out.push(`${tab}${tab}${tab}],`);
                    }
                    out.push(`${tab}${tab}},`);
                }
                out.push(`${tab}],`)
            }
            out.push('}')

            out.push(`export const ${name}TableIndexMap={`)
            out.push(...indexOut);
            out.push('}')
        }

        importMap[allTableArrayName]=packageName;
        out.push(`export const ${allTableArrayName}=[${tableNames.join(',')}] as const`)
        out.push(`Object.freeze(${allTableArrayName})`)


        if(imports.length){
            protoPrependTsImports(imports,importMap,out,localImportMap);
        }

        out.splice(0,0,`// this file was autogenerated by @iyio/protogen - https://github.com/iyioio/common/packages/protogen`);
        out.splice(1,0,`// generator = tablePlugin`);

        outputs.push({
            path:joinPaths(path,tableFilename),
            content:out.join('\n'),
        })

        outputs.push({
            path:joinPaths(path,tableIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })

        if(tableCdkConstructFile){
            outputs.push({
                path:tableCdkConstructFile,
                content:tableCdkTemplate(tableCdkConstructClassName,tableInfos,importMap)
            })
        }
    }
}
