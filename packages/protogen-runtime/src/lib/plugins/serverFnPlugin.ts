import { getFileNameNoExt, joinPaths, strFirstToLower } from "@iyio/common";
import { getProtoPluginPackAndPath, protoFormatTsComment, protoGenerateTsIndex, protoIsTsBuiltType, protoLabelOutputLines, protoMergeTsImports, ProtoPipelineConfigurablePlugin, protoPrependTsImports } from "@iyio/protogen";
import { z } from "zod";

const supportedTypes=['serverFn'];

const ServerFnPluginConfig=z.object(
{
    /**
     * @default .serverFnPackage
     */
    serverFnPath:z.string().optional(),

    /**
     * @default "serverFns"
     */
    serverFnPackage:z.string().optional(),

    /**
     * @default .serverFnClientPackage
     */
    serverFnClientPath:z.string().optional(),

    /**
     * @default "serverFnsClient"
     */
    serverFnClientPackage:z.string().optional(),

    /**
     * @default "serverFn-params.ts"
     */
    serverFnParamsFilename:z.string().optional(),

    /**
     * @default "serverFn-client-index.ts"
     */
    serverFnClientIndexFilename:z.string().optional(),

    /**
     * @default "serverFnClients.ts"
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
    },{
        serverFnPackage='serverFns',
        serverFnPath=serverFnPackage,
        serverFnClientPackage='serverFnsClient',
        serverFnClientPath=serverFnClientPackage,
        serverFnParamsFilename='serverFn-params.ts',
        serverFnHandlerName='handler',
        serverFnLibPackage='@iyio/common',
        serverFnClientFilename='serverFnClients.ts',
        serverFnLambdaPackage='@iyio/aws-lambda',
        serverFnClientIndexFilename='serverFn-client-index.ts',
    })=>{

        const {path}=getProtoPluginPackAndPath(
            namespace,
            serverFnPackage,
            serverFnPath
        );

        const {path:clientPath}=getProtoPluginPackAndPath(
            namespace,
            serverFnClientPackage,
            serverFnClientPath,
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



        for(const node of supported){

            const out:string[]=[];
            const imports:string[]=[];

            const name=node.name;

            const inputType=node.children?.['input']?.type??'void';
            const outputType=node.children?.['output']?.type??'void';
            const inputPackage=importMap[inputType+'Scheme'];
            const outputPackage=importMap[outputType+'Scheme'];

            const paramName=strFirstToLower(name)+'ArnParam';
            importMap[paramName]=serverFnClientPackage;
            clientParamImports.push(paramName);
            paramsOut.push(`export const ${paramName}=defineStringParam('${strFirstToLower(name)}Arn');`);

            const clientName=name.endsWith('Fn')?name.substring(0,name.length-2):name;
            importMap[clientName]=serverFnClientPackage;
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
                path:joinPaths(path,name+'.ts'),
                content:out.join('\n'),
                autoMerge:true,
                mergeHandler:protoMergeTsImports
            })

        }

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
            generator:{
                root:clientPath,
                generator:protoGenerateTsIndex
            }
        })

    }
}
