import { getFileNameNoExt, HashMap, joinPaths, strFirstToLower } from "@iyio/common";
import { addTsImport, getProtoPluginPackAndPath, protoFormatTsComment, protoGenerateTsIndex, protoGetChildren, protoGetChildrenByName, protoMergeTsImports, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";
import { getTsSchemeName, SharedTsPluginConfigScheme } from "../sharedTsConfig";
import { tableCdkTemplate, TableNameParamNamePair } from "./tableCdkTemplate";



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
     * @default "table-param.ts"
     */
    tableParamsFilename:z.string().optional(),


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
    },{
        tablePath,
        tablePackage='tables',
        tableFilename='tables.ts',
        tableParamsFilename='table-params.ts',
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
        }

        log(`${supported.length} supported node(s)`);

        const out:string[]=[];
        const paramsOut:string[]=[];

        const paramImportName='./'+getFileNameNoExt(tableParamsFilename);
        const paramNames:string[]=[];

        const tableNames:string[]=[];
        const tableInfos:TableNameParamNamePair[]=[];

        for(const node of supported){

            const name=node.name;
            const paramName=strFirstToLower(name)+'TableParam';
            paramNames.push(paramName);
            importMap[name+'Table']=packageName;

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

            const primary=props.find(n=>n.children?.['primaryKey']);
            out.push(`${tab}primaryKey:${primary?JSON.stringify(primary.name):'"id"'},`);


            if(tableUseParamIds){
                addImport(paramName,packageName);
                localImportMap[paramName]=paramImportName;
                paramsOut.push(`export const ${paramName}=defineStringParam('${name}Table');`)
                out.push(`${tab}tableIdParam:${paramName},`)
            }

            const config=node.children?.['$table']?.children??{};
            let configValue:string|undefined;

            configValue=config['scheme']?.value??getTsSchemeName(name,tsConfig);

            if(importMap[configValue]){
                addImport(configValue);
                out.push(`${tab}scheme:${configValue},`)
            }

            if(configValue=config['mousePath']?.value){
                out.push(`${tab}mousePath:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['mousePath']?.value){
                out.push(`${tab}mousePath:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['mousePath']?.value){
                out.push(`${tab}mousePath:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['isReadonly']?.value){
                out.push(`${tab}isReadonly:${JSON.stringify(Boolean(configValue))},`)
            }

            if(configValue=config['watchable']?.value){
                out.push(`${tab}watchable:${JSON.stringify(Boolean(configValue))},`)
            }

            if(configValue=config['defaultOrderProp']?.value){
                out.push(`${tab}defaultOrderProp:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['defaultOrderDesc']?.value){
                out.push(`${tab}defaultOrderDesc:${JSON.stringify(Boolean(configValue))},`)
            }

            if(configValue=config['ttlProp']?.value??props.find(p=>p.name==='ttl')?.name){
                out.push(`${tab}ttlProp:${JSON.stringify(configValue)},`)
            }

            if(configValue=config['updateVersionProp']?.value??props.find(p=>p.name==='uv')?.name){
                out.push(`${tab}updateVersionProp:${JSON.stringify(configValue)},`)
            }

            const indexes=protoGetChildrenByName(node.children?.['$table'],'index',false);
            if(indexes.length){
                out.push(`${tab}indexes:[`)
                for(let i=0;i<indexes.length;i++){
                    const index=indexes[i];
                    const indexName=index.value||'index'+i;
                    out.push(`${tab}${tab}{`);
                    out.push(`${tab}${tab}${tab}name:${JSON.stringify(indexName)},`);
                    const primaryProp=index.children?.['primary']?.value;
                    out.push(`${tab}${tab}${tab}primary:${JSON.stringify(primaryProp??indexName)},`);
                    const sortProp=index.children?.['sort']?.value;
                    if(sortProp){
                        out.push(`${tab}${tab}${tab}sort:${JSON.stringify(sortProp)},`);
                    }
                    if(index.children?.['includeAll']){
                        out.push(`${tab}${tab}${tab}includeAll:true,`);
                    }
                    const includeProps=protoGetChildren(index.children?.['include'],false);
                    if(includeProps.length){
                        out.push(`${tab}${tab}${tab}include:[`);
                        for(const incProp of includeProps){
                            out.push(`${tab}${tab}${tab}${tab}${JSON.stringify(incProp.name)},`);
                        }
                        out.push(`${tab}${tab}${tab}],`);
                    }
                    out.push(`${tab}${tab}},`);
                }
                out.push(`${tab}],`)
            }

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

        if(paramsOut.length){
            paramsOut.splice(0,0,`// this file was autogenerated by @iyio/protogen - https://github.com/iyioio/common/packages/protogen`);
            paramsOut.splice(1,0,`// generator = tablePlugin`);
            paramsOut.splice(2,0,'import { defineStringParam } from "@iyio/common";')
            paramsOut.splice(3,0,'');
            outputs.push({
                path:joinPaths(path,tableParamsFilename),
                content:paramsOut.join('\n'),
            })
        }

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
                content:tableCdkTemplate(tableCdkConstructClassName,tableInfos,importMap),
                mergeHandler:protoMergeTsImports,
            })
        }
    }
}
