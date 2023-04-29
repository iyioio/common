import { SiteContentSourceDescription } from "@iyio/cdk-common";
import { getSubstringCount, joinPaths } from "@iyio/common";
import { ProtoPipelineConfigurablePlugin, getProtoPluginPackAndPath, protoAddContextParam, protoFormatTsComment, protoGenerateTsIndex, protoGetChildrenByName, protoIsTsBuiltType, protoLabelOutputLines, protoNodeChildrenToAccessRequests, protoPrependTsImports } from "@iyio/protogen";
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


    /**
     * If true function stub files will include a call to an init function
     * @default true
     */
    serverFnInit:z.boolean().optional(),
    serverFnInitFunction:z.string().optional(),
    serverFnInitFunctionPackage:z.string().optional(),
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
        paramMap,
        paramPackage,
    },{
        serverFnPackage='fns',
        serverFnPath=serverFnPackage,
        serverFnClientPackage='fn-clients',
        serverFnIndexFilename='fn-index.ts',
        serverFnClientPath=serverFnClientPackage,
        serverFnHandlerName='handler',
        serverFnLibPackage='@iyio/common',
        serverFnClientFilename='fn-clients.ts',
        serverFnLambdaPackage='@iyio/aws-lambda',
        serverFnClientIndexFilename='fn-clients-index.ts',
        serverFnCdkConstructClassName='Fns',
        serverFnCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${serverFnCdkConstructClassName}.ts`:undefined,
        serverFnInit=true,
        serverFnInitFunction='initBackend',
        serverFnInitFunctionPackage=`backend`
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

            const inputNode=node.children?.['input'];
            const outputNode=node.children?.['output'];
            const inputIsArray=inputNode?.types[0]?.isArray??false;
            const outputIsArray=outputNode?.types[0]?.isArray??false;
            const outputIsOptional=outputNode?.optional??false;
            const inputType=inputNode?.type??'void';
            const outputType=outputNode?.type??'void';
            const tsInputType=inputType+(inputIsArray?'[]':'');
            const tsOutputType=outputType+(outputIsArray?'[]':'')+(outputIsOptional?'|undefined':'');
            const inputScheme=inputType+'Scheme'+(inputIsArray?'.array()':'');
            const outputScheme=outputType+'Scheme'+(outputIsArray?'.array()':'')+(outputIsOptional?'.optional()':'');
            const inputPackage=importMap[inputType+'Scheme'];
            const outputPackage=importMap[outputType+'Scheme'];

            const paramName=protoAddContextParam(name+'Arn',paramPackage,paramMap,importMap);
            clientParamImports.push(paramName);

            const fnInfo:FnInfoTemplate={
                name,
                createProps:{
                    createPublicUrl:node.children?.['publicUrl']?.value==='true',
                    handlerFileName:joinPaths(cdkRelPath,filepath),
                    handler:'handler'
                },
                arnParam:paramName
            };
            infos.push(fnInfo);

            if(fnInfo.createProps.createPublicUrl){
                const urlParamName=protoAddContextParam(name+'Url',paramPackage,paramMap,importMap);
                fnInfo.urlParam=urlParamName;
            }

            const siteSources=protoGetChildrenByName(node,'siteSource',false);
            if(siteSources.length){
                const sources:SiteContentSourceDescription[]=[];
                fnInfo.siteSources=sources;
                for(const ss of siteSources){
                    const target=nodes.find(n=>n.name===ss.type);
                    if(!target){
                        throw new Error(`No matching site source found for ${ss.type}. Fn=${node.name}`);
                    }
                    let prefix=ss.children?.['prefix']?.value;
                    if(prefix){
                        if(!prefix.startsWith('/')){
                            prefix='/'+prefix;
                        }
                        if(!prefix.endsWith('/')){
                            prefix+='/';
                        }
                    }
                    sources.push({
                        targetSiteName:ss.type,
                        prefix,
                        accessSiteOrigin:ss.children?.['accessSiteOrigin']?true:false,
                    })
                }
            }

            const accessProp=node.children?.['$access'];
            if(accessProp?.children){
                fnInfo.accessRequests=protoNodeChildrenToAccessRequests(accessProp);
            }

            const clientName='invoke'+name;
            importMap[clientName]=clientPackageName;
            if(node.comment){
                clientOut.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }
            clientOut.push(`export const ${clientName}=(input:${tsInputType}):Promise<${tsOutputType}>=>(`)
            clientOut.push(`${tab}lambdaClient().invokeAsync<${tsInputType},${tsOutputType}>({`);
            clientOut.push(`${tab}${tab}fn:${paramName}(),`)
            clientOut.push(`${tab}${tab}input,`)
            if(inputPackage){
                clientInputs.push(inputType+'Scheme');
                clientOut.push(`${tab}${tab}inputScheme:${inputScheme},`)
            }
            if(outputPackage){
                clientInputs.push(outputType+'Scheme');
                clientOut.push(`${tab}${tab}outputScheme:${outputScheme},`)
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

            out.push(`import { createFnHandler, FnEvent } from '${serverFnLibPackage}';`);
            if(serverFnInit){
                out.push(`import { ${serverFnInitFunction} } from "@${namespace}/${serverFnInitFunctionPackage}";`)
            }
            out.push('');
            if(serverFnInit){
                out.push(`${serverFnInitFunction}();`);
                out.push('');
            }
            if(node.comment){
                out.push(...protoFormatTsComment(node.comment,'').split('\n'))
            }
            let startI=out.length;
            out.push(`const ${name}=async (`);
            out.push(`${tab}fnEvt:FnEvent${inputType==='void'?'':','}`);
            out.push(`${inputType==='void'?'':`${tab}input:${tsInputType}`}`);
            out.push(`):Promise<${tsOutputType}>=>{`);
            protoLabelOutputLines(out,'head',startI);


            out.push(`${tab}// do cool stuff`)
            out.push(`${tab}throw new Error('${name} not implemented');`)
            out.push('}')
            out.push('');

            startI=out.length
            out.push(isDefault?`export default ${name};`:`export const ${handlerName}=createFnHandler(${name},{`);
            if(inputPackage){
                imports.push(inputType+'Scheme');
                out.push(`${tab}inputScheme:${inputScheme},`)
            }
            if(outputPackage){
                imports.push(outputType+'Scheme');
                out.push(`${tab}outputScheme:${outputScheme},`)
            }
            out.push('});');
            protoLabelOutputLines(out,'handlerExport',startI);

            protoPrependTsImports(imports,importMap,out);

            outputs.push({
                path:filepath,
                content:out.join('\n'),
                mainExport:isDefault?undefined:handlerName,
                mainExportAs:name,
                autoMerge:true
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

        clientOut.unshift(`import { ${clientParamImports.join(', ')} } from '${paramPackage}';`)
        protoPrependTsImports(clientInputs,importMap,clientOut);
        outputs.push({
            path:joinPaths(clientPath,serverFnClientFilename),
            content:clientOut.join('\n'),
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
            })
        }

    }
}
