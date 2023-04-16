import { CommonAccessType } from "@iyio/cdk-common";
import { getFileNameNoExt, getSubstringCount, joinPaths, strFirstToLower } from "@iyio/common";
import { getProtoPluginPackAndPath, protoFormatTsComment, protoGenerateTsIndex, protoIsTsBuiltType, protoLabelOutputLines, protoMergeTsImports, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";
import { FnInfoTemplate, serverFnCdkTemplate } from "./serverFnCdkTemplate";

const supportedTypes=['serverFn'];

const ServerFnPluginConfig=z.object(
{
    /**
     * @default .serverFnPackage
     */
    serverFnPath:z.string().optional(),

    /**
     * @default "fns"
     */
    serverFnPackage:z.string().optional(),

    /**
     * @default .serverFnClientPackage
     */
    serverFnClientPath:z.string().optional(),

    /**
     * @default "fn-clients"
     */
    serverFnClientPackage:z.string().optional(),

    /**
     * @default "fn-params.ts"
     */
    serverFnParamsFilename:z.string().optional(),

    /**
     * @default "fn-clients-index.ts"
     */
    serverFnClientIndexFilename:z.string().optional(),

    /**
     * @default "fn-clients.ts"
     */
    serverFnClientFilename:z.string().optional(),

    /**
     * @default "handler"
     */
    serverFnHandlerName:z.string().optional(),

    /**
     * @default "@iyio/common"
     */
    serverFnLibPackage:z.string().optional(),

    /**
     * @default "@iyio/aws-lambda"
     */
    serverFnLambdaPackage:z.string().optional(),

    serverFnIndexFilename:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the
     * functions
     */
    serverFnCdkConstructFile:z.string().optional(),

    /**
     * @default "Fns"
     */
    serverFnCdkConstructClassName:z.string().optional(),

    /**
     * Path where
     */
    serverFnDistPath:z.string().optional(),
})

export const serverFnPlugin:ProtoPipelineConfigurablePlugin<typeof ServerFnPluginConfig>=
{
    configScheme:ServerFnPluginConfig,
    generate:async ({
        importMap,
        outputs,
        tab,
        log,
        nodes,
        namespace,
        packagePaths,
        libStyle,
    },{
        serverFnPackage='fns',
        serverFnPath=serverFnPackage,
        serverFnClientPackage='fn-clients',
        serverFnIndexFilename='fn-index.ts',
        serverFnClientPath=serverFnClientPackage,
        serverFnParamsFilename='fn-params.ts',
        serverFnHandlerName='handler',
        serverFnLibPackage='@iyio/common',
        serverFnClientFilename='fn-clients.ts',
        serverFnLambdaPackage='@iyio/aws-lambda',
        serverFnClientIndexFilename='fn-clients-index.ts',
        serverFnCdkConstructClassName='Fns',
        serverFnCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${serverFnCdkConstructClassName}.ts`:undefined,
    })=>{

        const {path}=getProtoPluginPackAndPath(
            namespace,
            serverFnPackage,
            serverFnPath,
            libStyle,
            {packagePaths,indexFilename:serverFnIndexFilename},
        );

        const cdkRelPath=(
            '../'
            .repeat(getSubstringCount(path,'/')-1)
        )

        const {path:clientPath,packageName:clientPackageName}=getProtoPluginPackAndPath(
            namespace,
            serverFnClientPackage,
            serverFnClientPath,
            libStyle,
            {packagePaths,indexFilename:serverFnClientIndexFilename},
        );

        const supported=nodes.filter(n=>supportedTypes.includes(n.type));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        const paramsOut:string[]=[];
        paramsOut.push('import { defineStringParam } from "@iyio/common";');
        paramsOut.push('');

        const clientOut:string[]=[];
        const clientInputs:string[]=[];
        const clientParamImports:string[]=[];
        clientOut.push(`import { lambdaClient } from '${serverFnLambdaPackage}';`);
        clientOut.push('');

        const infos:FnInfoTemplate[]=[];


        for(const node of supported){

            const out:string[]=[];
            const imports:string[]=[];

            const name=node.name;
            const filepath=joinPaths(path,name+'.ts');

            const inputType=node.children?.['input']?.type??'void';
            const outputType=node.children?.['output']?.type??'void';
            const inputPackage=importMap[inputType+'Scheme'];
            const outputPackage=importMap[outputType+'Scheme'];

            const paramName=strFirstToLower(name)+'ArnParam';
            importMap[paramName]=clientPackageName;
            clientParamImports.push(paramName);
            paramsOut.push(`export const ${paramName}=defineStringParam('${strFirstToLower(name)}Arn');`);

            const fnInfo:FnInfoTemplate={
                name,
                createProps:{
                    createPublicUrl:node.children?.['$publicUrl']?.value==='true',
                    handlerFileName:joinPaths(cdkRelPath,filepath),
                    handler:'handler'
                },
                arnParam:paramName,
                accessRequests:[]
            };
            infos.push(fnInfo);

            const accessProp=node.children?.['access'];
            if(accessProp?.children){
                for(const c in accessProp.children){
                    const child=accessProp.children[c];
                    const types=child.name.split('-') as CommonAccessType[];
                    for(const type of child.types){
                        fnInfo.accessRequests?.push({
                            grantName:type.type,
                            types,
                        })
                    }

                }
                let child=accessProp.children?.['read'];
                if(child){
                    for(const type of child.types){
                        fnInfo.accessRequests?.push({
                            grantName:type.type,
                            types:['read'],
                        })
                    }
                }
                child=accessProp.children?.['write'];
                if(child){
                    for(const type of child.types){
                        fnInfo.accessRequests?.push({
                            grantName:type.type,
                            types:['write'],
                        })
                    }
                }
                child=accessProp.children?.['readWrite'];
                if(child){
                    for(const type of child.types){
                        fnInfo.accessRequests?.push({
                            grantName:type.type,
                            types:['read','write'],
                        })
                    }
                }
            }

            const clientName=name.endsWith('Fn')?name.substring(0,name.length-2):name;
            importMap[clientName]=clientPackageName;
            if(node.comment){
                clientOut.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }
            clientOut.push(`export const ${clientName}=(input:${inputType}):Promise<${outputType}>=>(`)
            clientOut.push(`${tab}lambdaClient().invokeAsync<${inputType},${outputType}>({`);
            clientOut.push(`${tab}${tab}fn:${paramName}(),`)
            clientOut.push(`${tab}${tab}input,`)
            if(inputPackage){
                clientInputs.push(inputType+'Scheme');
                clientOut.push(`${tab}${tab}inputScheme:${inputType}Scheme,`)
            }
            if(outputPackage){
                clientInputs.push(outputType+'Scheme');
                clientOut.push(`${tab}${tab}outputScheme:${outputType}Scheme,`)
            }
            clientOut.push(`${tab}})`);
            clientOut.push(')');
            clientOut.push('');

            const handlerName=node.children?.['handlerName']?.value??serverFnHandlerName;
            const isDefault=handlerName==='default';


            if(!protoIsTsBuiltType(inputType)){
                imports.push(inputType);
                clientInputs.push(inputType);
            }

            if(!protoIsTsBuiltType(outputType)){
                imports.push(outputType);
                clientInputs.push(outputType);
            }

            out.push(`import { createFnHandler, FnEvent } from '${serverFnLibPackage}';`)
            out.push('');
            if(node.comment){
                out.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }
            const startI=out.length;
            out.push(`const ${name}=async (`);
            out.push(`${tab}fnEvt:FnEvent${inputType==='void'?'':','}`);
            out.push(`${inputType==='void'?'':`${tab}input:${inputType}`}`);
            out.push(`):Promise<${outputType}>=>{`);
            protoLabelOutputLines(out,'head',startI);


            out.push(`${tab}// do cool stuff`)
            out.push('}')
            out.push('');
            out.push(isDefault?`export default ${name};`:`export const ${handlerName}=createFnHandler(${name},{`);
            if(inputPackage){
                imports.push(inputType+'Scheme');
                out.push(`${tab}inputScheme:${inputType}Scheme,`)
            }
            if(outputPackage){
                imports.push(outputType+'Scheme');
                out.push(`${tab}outputScheme:${outputType}Scheme,`)
            }
            out.push('});');

            protoPrependTsImports(imports,importMap,out);

            outputs.push({
                path:filepath,
                content:out.join('\n'),
                mainExport:isDefault?undefined:handlerName,
                mainExportAs:name,
                autoMerge:true,
                mergeHandler:protoMergeTsImports
            })

        }

        outputs.push({
            path:joinPaths(path,serverFnIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })

        clientOut.unshift(`import { ${clientParamImports.join(', ')} } from './${getFileNameNoExt(serverFnParamsFilename)}';`)
        protoPrependTsImports(clientInputs,importMap,clientOut);
        outputs.push({
            path:joinPaths(clientPath,serverFnClientFilename),
            content:clientOut.join('\n'),
        })
        outputs.push({
            path:joinPaths(clientPath,serverFnParamsFilename),
            content:paramsOut.join('\n'),
        })
        outputs.push({
            path:joinPaths(clientPath,serverFnClientIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:clientPath,
                generator:protoGenerateTsIndex
            }
        })

        if(serverFnCdkConstructFile){
            outputs.push({
                path:serverFnCdkConstructFile,
                content:serverFnCdkTemplate(serverFnCdkConstructClassName,infos,importMap),
                mergeHandler:protoMergeTsImports,
            })
        }

    }
}
