import { SqlMigration, getFileName, joinPaths } from "@iyio/common";
import { execAsync, pathExistsAsync } from "@iyio/node-common";
import { ProtoPipelineConfigurablePlugin, getProtoPluginPackAndPath, protoGenerateTsIndex, protoGetChildrenByName } from "@iyio/protogen";
import { mkdir, readFile, writeFile } from "fs/promises";
import { z } from "zod";

const SqlMigrationsConfig=z.object(
{
    /**
     * @default .sqlMigrationsPackage
     */
    sqlMigrationsPath:z.string().optional(),

    /**
     * @default "sql-migrations"
     */
    sqlMigrationsPackage:z.string().optional(),

    /**
     * @default "sql-migrations-index.ts"
     */
    sqlMigrationsIndexFilename:z.string().optional(),

    /**
     * If defined a CDK construct file will be generated that can be used to deploy the
     * tables
     */
    sqlMigrationCdkConstructFile:z.string().optional(),

    /**
     * @default "SqlMigrate"
     */
    sqlMigrationCdkConstructClassName:z.string().optional(),
})

export const sqlMigrationsPlugin:ProtoPipelineConfigurablePlugin<typeof SqlMigrationsConfig>=
{
    configScheme:SqlMigrationsConfig,
    generationStage:1,
    generate:async ({
        outputs,
        tab,
        log,
        nodes,
        namespace,
        packagePaths,
        libStyle,
        importMap,
    },{
        sqlMigrationsPackage='sql-migrations',
        sqlMigrationsPath=sqlMigrationsPackage,
        sqlMigrationsIndexFilename='sql-migrations-index.ts',
        //sqlMigrationCdkConstructClassName='SqlMigrate',
        //sqlMigrationCdkConstructFile=libStyle==='nx'?`packages/cdk/src/${sqlMigrationCdkConstructClassName}.ts`:undefined,

    })=>{

        const schemeOutput=outputs.find(o=>o.metadata?.['sqlTableSchemaPath']===true);
        if(!schemeOutput){
            log('No schemeOutput found');
            return;
        }

        const supported=nodes.filter(node=>node.types.some(t=>t.type==='sqlMigrations'));

        log(`${supported.length} supported node(s)`);
        if(!supported.length){
            return;
        }

        const {path,packageName,removePackage}=getProtoPluginPackAndPath(
            namespace,
            sqlMigrationsPackage,
            sqlMigrationsPath,
            libStyle,
            {packagePaths,indexFilename:sqlMigrationsIndexFilename}
        );

        if(!await pathExistsAsync(path)){
            await mkdir(path,{recursive:true});
        }

        // migrations
        const content=(await readFile(schemeOutput.path)).toString();

        for(const node of supported){
            if(!node.children){
                continue;
            }

            const out:SqlMigration[]=[];
            let prevSchemePath:string|null=null;
            for(const cn in node.children){
                const child=node.children[cn];
                if(!child || child.isContent || child.special){
                    continue;
                }
                const name=(node.name+'-'+getFileName(child.name)).replace(/[^a-z0-9_-]/gi,'');
                const schemePath=joinPaths(path,name+'.prisma');
                const sqlUpPath=joinPaths(path,name+'-up.sql');
                const sqlDownPath=joinPaths(path,name+'-down.sql');
                const [schemeExists,sqlUpExists,sqlDownExists]=await Promise.all([
                    pathExistsAsync(schemePath),
                    pathExistsAsync(sqlUpPath),
                    pathExistsAsync(sqlDownPath),
                ])
                if(!schemeExists){
                    await writeFile(schemePath,content);
                }
                let sqlUp:string;
                let sqlDown:string;
                const upChildren=protoGetChildrenByName(child,'$up',false);
                const downChildren=protoGetChildrenByName(child,'$down',false);
                const inlineSql=(upChildren.length || downChildren.length)?true:false;
                if(inlineSql){
                    sqlUp=upChildren.map(c=>c.value??'').join('\n')||'-- empty';
                    sqlDown=downChildren.map(c=>c.value??'').join('\n')||'-- empty';
                    await writeFile(sqlUpPath,sqlUp);
                    await writeFile(sqlDownPath,sqlDown);
                }else{
                    if(sqlUpExists){
                        sqlUp=(await readFile(sqlUpPath)).toString();
                    }else{
                        sqlUp=await execAsync(`npx prisma migrate diff ${
                            prevSchemePath?`--from-schema-datamodel ${prevSchemePath}`:'--from-empty'
                            } --to-schema-datamodel ${schemePath} --script`
                        );

                        await writeFile(sqlUpPath,sqlUp);

                    }
                    if(sqlDownExists){
                        sqlDown=(await readFile(sqlDownPath)).toString();
                    }else{
                        sqlDown=await execAsync(`npx prisma migrate diff ${
                            prevSchemePath?`--to-schema-datamodel ${prevSchemePath}`:'--to-empty'
                            } --from-schema-datamodel ${schemePath} --script`
                        );

                        await writeFile(sqlDownPath,sqlDown);
                    }
                }

                out.push({
                    name,
                    up:sqlUp,
                    down:sqlDown,
                    upTrigger:child.children?.['upTrigger']?.value as any,
                    downTrigger:child.children?.['downTrigger']?.value as any,
                });

                if(!inlineSql){
                    prevSchemePath=schemePath;
                }
            }

            if(out.length){
                outputs.push({
                    path:joinPaths(path,node.name+'.ts'),
                    content:`export const ${node.name}=${JSON.stringify(out,null,tab)}`
                })
                importMap[node.name]=packageName;
            }
        }


        if(outputs.length){
            // add index file
            outputs.push({
                path:joinPaths(path,sqlMigrationsIndexFilename),
                content:'',
                isPackageIndex:true,
                generator:{
                    root:path,
                    generator:protoGenerateTsIndex
                }
            })


        }else{
            removePackage();
        }
    }
}
