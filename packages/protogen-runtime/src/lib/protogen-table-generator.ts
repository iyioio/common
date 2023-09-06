import { DataTableDescription, DataTableIndex, HashMap, joinPaths } from "@iyio/common";
import { ProtoContext, ProtoNode, addTsImport, getProtoPluginPackAndPath, protoAddContextParam, protoFormatTsComment, protoGenerateTsIndex, protoGetChildren, protoGetChildrenByName, protoGetParamName, protoPrependTsImports } from "@iyio/protogen";
import { TableNameParamNamePair } from "./plugins/tableCdkTemplate";
import { SharedTsPluginConfig, getTsSchemeName } from "./sharedTsConfig";

const notWordRegex=/\W/g;

export interface DataTableDescriptionRef extends DataTableDescription<any>
{
    tableIdParamName?:string;
    schemeName?:string;
    node:ProtoNode;
}

export interface GenerateProtoTableOptions extends SharedTsPluginConfig{

    tablePath?:string;

    tableFilename:string;

    tableIndexFilename:string;

    tablePackage:string;

    /**
     * If true the tableIdParam of generated tables will be populated and a table-params file will be generated.
     */
    tableUseParamIds?:boolean;

    /**
     * @default '@iyio/common'
     */
    dataTableDescriptionPackage?:string;

    /**
     * @default 'allTables'
     */
    allTableArrayName?:string;

    supportedTypes:string[];
    pluginName:string;
    forEachTable?:(table:DataTableDescriptionRef)=>void|Promise<void>;

    paramNameSuffix?:string;

    tableType?:string;

}

export interface GenerateProtoTableResult
{
    path:string;
    packageName:string;
    tables:DataTableDescriptionRef[];
    tableInfos:TableNameParamNamePair[];
}

export const generateProtoTable=async ({
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
}:ProtoContext,{
    supportedTypes,
    pluginName,
    forEachTable,
    tablePath,
    tablePackage,
    tableFilename,
    tableIndexFilename,
    tableUseParamIds,
    dataTableDescriptionPackage='@iyio/common',
    allTableArrayName,
    paramNameSuffix='',
    tableType,
    ...tsConfig
}:GenerateProtoTableOptions):Promise<GenerateProtoTableResult|null>=>{

    const supported=nodes.filter(node=>node.types.some(t=>supportedTypes.includes(t.type)));

    if(!supported.length){
        return null;
    }

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

    addImport('DataTableDescription',dataTableDescriptionPackage);

    log(`${supported.length} supported node(s)`);

    const out:string[]=[];

    const tableNames:string[]=[];
    const tableInfos:TableNameParamNamePair[]=[];
    const tables:DataTableDescriptionRef[]=[];
    let indexUsed=false;

    for(const node of supported){

        const name=node.name;
        const paramName=protoGetParamName(name+paramNameSuffix+'Table');
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
        const dataTable:DataTableDescriptionRef={
            name,
            primaryKey:configValue,
            node,
        }

        if(configValue=config['sortKey']?.value?.replace(notWordRegex,'')){
            out.push(`${tab}sortKey:${JSON.stringify(configValue)},`)
            dataTable.sortKey=configValue;

            const sortProp=node.children?.[configValue]?.type??'string';
            const sortKeyType=sortProp==='string'?'string':'number';
            out.push(`${tab}sortKeyType:${JSON.stringify(sortKeyType)},`);
            dataTable.sortKeyType=sortKeyType;
        }


        if(tableUseParamIds){
            protoAddContextParam(name+paramNameSuffix+'Table',paramPackage,paramMap,importMap);
            addImport(paramName,paramPackage);
            out.push(`${tab}tableIdParam:${paramName},`);
            dataTable.tableIdParamName=paramName;
        }


        configValue=config['scheme']?.value??getTsSchemeName(name,tsConfig);

        if(importMap[configValue]){
            addImport(configValue);
            out.push(`${tab}scheme:${configValue},`);
            dataTable.schemeName=configValue;
        }

        if(configValue=config['mountPath']?.value){
            out.push(`${tab}mountPath:${JSON.stringify(configValue)},`)
            dataTable.mountPath=configValue;
        }

        if(configValue=config['isReadonly']?.value){
            out.push(`${tab}isReadonly:${JSON.stringify(Boolean(configValue))},`)
            dataTable.isReadonly=Boolean(configValue);
        }

        if(configValue=config['watchable']?.value?.replace(notWordRegex,'')){
            out.push(`${tab}watchable:${JSON.stringify(Boolean(configValue))},`)
            dataTable.watchable=Boolean(configValue);
        }

        if(configValue=config['defaultOrderProp']?.value?.replace(notWordRegex,'')){
            out.push(`${tab}defaultOrderProp:${JSON.stringify(configValue)},`)
            dataTable.defaultOrderProp=configValue;
        }

        if(configValue=config['defaultOrderDesc']?.value?.replace(notWordRegex,'')){
            out.push(`${tab}defaultOrderDesc:${JSON.stringify(Boolean(configValue))},`)
            dataTable.defaultOrderDesc=Boolean(configValue);
        }

        if(configValue=config['ttlProp']?.value?.replace(notWordRegex,'')??props.find(p=>p.name==='ttl')?.name){
            out.push(`${tab}ttlProp:${JSON.stringify(configValue)},`);
            dataTable.ttlProp=configValue;
        }

        if(configValue=config['updateVersionProp']?.value?.replace(notWordRegex,'')??props.find(p=>p.name==='uv')?.name){
            out.push(`${tab}updateVersionProp:${JSON.stringify(configValue)},`)
            dataTable.updateVersionProp=configValue;
        }

        if(configValue=config['tableType']?.value||tableType){
            out.push(`${tab}tableType:${JSON.stringify(configValue)},`)
            dataTable.tableType=configValue;
        }

        const indexes=protoGetChildrenByName(node.children?.['$table'],'index',false);
        const indexOut:string[]=[];
        if(indexes.length){
            indexUsed=true;
            dataTable.indexes=[];
            out.push(`${tab}indexes:[`)
            for(let i=0;i<indexes.length;i++){
                const index=indexes[i];
                const indexName=index.value||'index'+i;
                indexOut.push(`${tab}${JSON.stringify(indexName)}:${name}Table.indexes?.[${i}] as DataTableIndex,`)
                out.push(`${tab}${tab}{`);
                out.push(`${tab}${tab}${tab}name:${JSON.stringify(indexName)},`);
                const primaryProp=index.children?.['primary']?.value?.replace(notWordRegex,'');
                out.push(`${tab}${tab}${tab}primary:${JSON.stringify(primaryProp??indexName)},`);
                const dbIndex:DataTableIndex={name:indexName,primary:primaryProp??indexName};
                dataTable.indexes.push(dbIndex);
                const sortProp=index.children?.['sort']?.value?.replace(notWordRegex,'');
                if(sortProp){
                    out.push(`${tab}${tab}${tab}sort:${JSON.stringify(sortProp)},`);
                    dbIndex.sort=sortProp;
                }
                if(index.children?.['includeAll']){
                    out.push(`${tab}${tab}${tab}includeAll:true,`);
                    dbIndex.includeAll=true;
                }
                const includeProps=protoGetChildrenByName(index.children?.['include'],'prop',false);
                if(includeProps.length){
                    const indexProps:string[]=[];
                    out.push(`${tab}${tab}${tab}include:[`);
                    for(const incProp of includeProps){
                        const indexPropName=incProp.value?.replace(notWordRegex,'');
                        out.push(`${tab}${tab}${tab}${tab}${JSON.stringify(indexPropName)},`);
                        indexProps.push(indexPropName??'')
                    }
                    out.push(`${tab}${tab}${tab}],`);
                    dbIndex.include=indexProps;
                }
                out.push(`${tab}${tab}},`);
            }
            out.push(`${tab}],`)
        }
        out.push('}')

        out.push(`export const ${name}TableIndexMap={`)
        out.push(...indexOut);
        out.push('}')
        tables.push(dataTable);
        if(forEachTable){
            await forEachTable(dataTable);
        }
    }

    if(indexUsed){
        addImport('DataTableIndex',dataTableDescriptionPackage);
    }

    if(allTableArrayName){
        importMap[allTableArrayName]=packageName;
        out.push(`export const ${allTableArrayName}=[${tableNames.join(',')}] as const`)
        out.push(`Object.freeze(${allTableArrayName})`)
    }


    if(imports.length){
        protoPrependTsImports(imports,importMap,out,localImportMap);
    }

    out.splice(0,0,`// this file was autogenerated by @iyio/protogen - https://github.com/iyioio/common/packages/protogen`);
    out.splice(1,0,`// generator = ${pluginName}`);

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



    return {path,packageName,tables,tableInfos};
}
