import { getDirectoryName, getFileNameNoExt, joinPaths, strFirstToLower } from "@iyio/common";
import { protoFormatTsComment, protoGetChildren, protoGetChildrenByName, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";
import { getTsSchemeName, SharedTsPluginConfigScheme } from "./sharedTsConfig";



const TablePluginConfig=z.object(
{
    /**
     * @default "tables.ts"
     */
    tableOutPath:z.string().optional(),


    /**
     * @default context.defaultPackageName
     */
    tablePackageName:z.string().optional(),

    /**
     * If true the tableIdParam of generated tables will be populated and a table-params file will be generated.
     */
    tableUseParamIds:z.boolean().optional(),

    /**
     * @default '@iyio/common'
     */
    dataTableDescriptionPackage:z.string().optional(),

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
        defaultPackageName,
    },{
        tableOutPath='tables.ts',
        tablePackageName=defaultPackageName,
        tableUseParamIds,
        dataTableDescriptionPackage='@iyio/common',
        ...tsConfig
    })=>{

        const imports:string[]=[];
        const addImport=(im:string,packageName?:string)=>{
            if(!imports.includes(im)){
                imports.push(im);
            }
            if(packageName){
                importMap[im]=packageName;
            }
        }

        const supported=nodes.filter(node=>node.types.some(t=>t.type==='table'));

        if(supported.length){
            addImport('DataTableDescription',dataTableDescriptionPackage);
        }

        log(`${supported.length} supported node(s)`);

        const out:string[]=[];
        const paramsOut:string[]=[];

        const paramImportName='./'+getFileNameNoExt(tableOutPath)+'-params';
        const paramsOutPath=joinPaths(getDirectoryName(tableOutPath),getFileNameNoExt(tableOutPath)+'-params.ts');

        for(const node of supported){

            const name=node.name;
            const paramName=strFirstToLower(name)+'TableParam';
            importMap[name+'Table']=tablePackageName;

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
                addImport(paramName,paramImportName);
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
                    out.push(`${tab}${tab}{`);
                    out.push(`${tab}${tab}${tab}name:${JSON.stringify(index.value||'index'+i)},`);
                    out.push(`${tab}${tab}${tab}props:[`);
                    const indexProps=protoGetChildren(index.children?.['props'],false);
                    for(const iProp of indexProps){
                        out.push(`${tab}${tab}${tab}${tab}${JSON.stringify(iProp.name)},`);
                    }
                    out.push(`${tab}${tab}${tab}],`);
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


        if(imports.length){
            protoPrependTsImports(imports,importMap,out);
        }

        out.splice(0,0,`// this file was autogenerated by @iyio/protogen - https://github.com/iyioio/common/packages/protogen`);
        out.splice(1,0,`// generator = tablePlugin`);

        outputs.push({
            path:tableOutPath,
            content:out.join('\n'),
        })

        if(paramsOut.length){
            paramsOut.splice(0,0,`// this file was autogenerated by @iyio/protogen - https://github.com/iyioio/common/packages/protogen`);
            paramsOut.splice(1,0,`// generator = tablePlugin`);
            paramsOut.splice(2,0,'import { defineStringParam } from "@iyio/common";')
            paramsOut.splice(3,0,'');
            outputs.push({
                path:paramsOutPath,
                content:paramsOut.join('\n'),
            })
        }
    }
}
