import { joinPaths } from "@iyio/common";
import { commonProtoFeatures, getProtoPluginPackAndPath, protoGenerateTsIndex, ProtoPipelineConfigurablePlugin } from "@iyio/protogen";
import { z } from "zod";

const impMarker='*****imp*****';
const argsMarker='*****args*****';

const CallablePluginConfig=z.object(
{
    /**
     * @default .callablePackage
     */
    callablePath:z.string().optional(),

    /**
     * @default "callables"
     */
    callablePackage:z.string().optional(),

    /**
     * @default "callables-index.ts"
     */
    callableIndexFilename:z.string().optional(),

    /**
     * If true the callable feature will be implemented even if not required by other plugins.
     * @default false
     */
    callableRequire:z.boolean().optional(),

    /**
     * The export name of the callableMap object
     * @default "callableMap"
     */
    callableMapName:z.string().optional(),
})

export const callablePlugin:ProtoPipelineConfigurablePlugin<typeof CallablePluginConfig>=
{
    configScheme:CallablePluginConfig,
    generate:async ({
        importMap,
        outputs,
        tab,
        log,
        namespace,
        packagePaths,
        libStyle,
        requiredFeatures,
        callables,
    },{
        callablePackage='callables',
        callablePath=callablePackage,
        callableIndexFilename='callables-index.ts',
        callableRequire=false,
        callableMapName='callableMap',
    })=>{

        if(!callableRequire && !requiredFeatures.has(commonProtoFeatures.callables)){
            log(`${commonProtoFeatures.callables} feature not required`);
            return;
        }

        const {path,packageName}=getProtoPluginPackAndPath(
            namespace,
            callablePackage,
            callablePath,
            libStyle,
            {packagePaths,indexFilename:callableIndexFilename}
        );

        log(`Implementing ${commonProtoFeatures.callables} feature`);

        const mapOut:string[]=[];
        const mapOutBody:string[]=[];


        let i=0;
        for(const call of callables){

            const out:string[]=[];

            const name='_call_'+call.name;
            importMap[name]=packageName;

            out.push('import { ProtoCallable } from "@iyio/protogen";');
            out.push(`import { ${call.exportName}  as _implementation } from "${call.package}";`);
            const includeArgs=call.argsExportName && call.argsExportName;
            if(includeArgs){
                out.push(`import { ${call.argsExportName}  as _args } from "${call.argsPackage}";`);
            }
            out.push('');

            out.push(`export const ${name}:ProtoCallable=${
                JSON.stringify({...call,implementation:impMarker,argsScheme:includeArgs?argsMarker:undefined},null,4)
                .replace(`"${impMarker}"`,'_implementation')
                .replace(`"${argsMarker}"`,'_args')}`);

            outputs.push({
                path:joinPaths(path,name+'.ts'),
                content:out.join('\n')
            })

            mapOut.push(`import { ${name} as _${i} } from "./${name}";`);
            mapOutBody.push(`${tab}${call.name}:_${i},`)

            i++;

        }


        importMap[callableMapName]=packageName;
        mapOut.push('');
        mapOut.push(`export const ${callableMapName}={`);
        mapOut.push(...mapOutBody);
        mapOut.push('} as const');

        outputs.push({
            path:joinPaths(path,'callableMap.ts'),
            content:mapOut.join('\n'),
        })


        // add index file
        outputs.push({
            path:joinPaths(path,callableIndexFilename),
            content:'',
            isPackageIndex:true,
            generator:{
                root:path,
                generator:protoGenerateTsIndex
            }
        })
    }
}
