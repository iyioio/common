import { useTempCognitoUser } from "@iyio/aws-credential-providers";
import { createScope, DataTableDescription, EnvParams, generateRandomTestStoreItem, parseConfigBool, Scope, shortUuid, testMountedStoreAsync, uuid } from "@iyio/common";
import { z } from "zod";
import { testDynamoDbTableParam } from './dynamo-test-lib';
import { createFilterExpression, FilterEntity } from "./dynamo-types";
import { DynamoClient } from './DynamoClient';




describe('DynamoStore', () => {

    if(!parseConfigBool(process.env['NX_RUN_LONG_RUNNING_TEST'])){
        it('should skip dynamo tests',()=>{
            // do nothing
        })
        return;
    }

    afterEach(async ()=>{
        const scope=createScope(reg=>{
            reg.addParams(new EnvParams());
        });

         const client=DynamoClient.fromScope(scope);

         const all=await client.getAllScanAsync<any>(testDynamoDbTableParam(scope));

         await Promise.all(all.map(i=>client.deleteAsync(testDynamoDbTableParam(scope),{id:i.id})));

         console.log('All deleted')
    })

    const putGetDeleteAsync=async (scope:Scope, onStore?:(store:DynamoClient)=>void)=>{

        const store=DynamoClient.fromScope(scope);

        const tableName=testDynamoDbTableParam(scope);

        onStore?.(store);

        const key=shortUuid();
        const item=generateRandomTestStoreItem();

        console.log(`put ${key}`);
        await store.putAsync(tableName,'id',item);


        console.log(`get ${key}`);
        const getR=await store.getAsync(tableName,{id:item.id});
        expect(getR).toEqual(item);


        console.log(`delete ${key}`);
        await store.deleteAsync(tableName,{id:item.id});


        console.log(`check ${key}`);
        const get2R=await store.getAsync(tableName,{id:item.id});
        expect(get2R).toBeUndefined();

        return {store,config:store.clientConfig};
    }

    it('should put, get and delete', async () => {

        const scope=createScope(reg=>{
            reg.addParams(new EnvParams());
        });

        const {store}=await putGetDeleteAsync(scope);

        expect((await store.getClient().config.credentials()).sessionToken).toBeUndefined();

    });

    it('should put, get and delete with cognito user',async ()=>{

        await useTempCognitoUser(reg=>{
            reg.addParams(new EnvParams());
        },async scope=>{

            const {store}=await putGetDeleteAsync(scope);

            expect((await store.getClient().config.credentials()).sessionToken).toBeTruthy();

        })
    });



    it('should meet standard mount operations',async ()=>{
         await useTempCognitoUser(reg=>{
            reg.addParams(new EnvParams());
        },async scope=>{
            const basePath='dynamo/test-items';
            const tableName=testDynamoDbTableParam(scope);
            await testMountedStoreAsync(scope,basePath,{
                    path:basePath,
                    store:DynamoClient.fromScope(scope,{
                        tableName
                    }).getStoreAdapter()
            })

        })
    })

    const runScan=async (count:number,filter:FilterEntity<Et>,items:Et[])=>{

        const scope=createScope(reg=>{
            reg.addParams(new EnvParams());
        });

        const TestTable:DataTableDescription<Et>={
            name:"Et",
            primaryKey:"id",
            tableIdParam:scope.to(testDynamoDbTableParam),
            scheme:EtScheme,
        }

         const client=DynamoClient.fromScope(scope);
         client.logCommandInput=true;

         await Promise.all(items.map(item=>client.putIntoTable(TestTable,item)));

         const result=await client.scanMatchTableAsync({
            table:TestTable,
            filter
         })

         expect(result.items.length).toBe(count);


    }

    it('should scan using match',async ()=>{

        await runScan(1,{
            str:'bob',
            num:5
        },[
            {
                id:uuid(),
                str:'bob',
                num:4
            },
            {
                id:uuid(),
                str:'bob',
                num:5
            },
            {
                id:uuid(),
                str:'tom',
                num:5,
            },
            {
                id:uuid(),
                str:'tom',
                num:4,
            },
        ])
    })

    it('should scan using eq',async ()=>{

        await runScan(1,{
            str:createFilterExpression({
                eq:'bob'
            })
        },[
            {
                id:uuid(),
                str:'bob',
            },
            {
                id:uuid(),
                str:'tom',
            },
        ])
    })

    it('should scan using neq',async ()=>{

        await runScan(2,{
            str:createFilterExpression({
                neq:'bob'
            })
        },[
            {
                id:uuid(),
                str:'bob',
            },
            {
                id:uuid(),
                str:'tom',
            },
            {
                id:uuid(),
                str:'jill',
            },
        ])
    })

    it('should scan using isIn',async ()=>{

        await runScan(2,{
            str:createFilterExpression({
                isIn:['bob','jill']
            })
        },[
            {
                id:uuid(),
                str:'bob',
            },
            {
                id:uuid(),
                str:'tom',
            },
            {
                id:uuid(),
                str:'jill',
            },
        ])
    })

    it('should scan using exists',async ()=>{

        await runScan(2,{
            str:createFilterExpression({
                exists:true
            })
        },[
            {
                id:uuid(),
                str:'bob',
            },
            {
                id:uuid(),
                str:'tom',
            },
            {
                id:uuid(),
            },
        ])
    })

    it('should scan using not exists',async ()=>{

        await runScan(1,{
            str:createFilterExpression({
                exists:false
            })
        },[
            {
                id:uuid(),
                str:'bob',
            },
            {
                id:uuid(),
                str:'tom',
            },
            {
                id:uuid(),
            },
        ])
    })

    it('should scan using type number',async ()=>{

        await runScan(1,{
            num:createFilterExpression({
                type:'N'
            })
        },[
            {
                id:uuid(),
                num:1
            },
            {
                id:uuid(),
                str:'tom',
            },
            {
                id:uuid(),
            },
        ])
    })

    it('should scan using type string',async ()=>{

        await runScan(1,{
            str:createFilterExpression({
                type:'S'
            })
        },[
            {
                id:uuid(),
                num:1
            },
            {
                id:uuid(),
                str:'tom',
            },
            {
                id:uuid(),
            },
        ])
    })

    it('should scan starts with',async ()=>{

        await runScan(1,{
            str:createFilterExpression({
                startsWith:'The qu',
            })
        },[
            {
                id:uuid(),
                num:1,
                str:'The quick brown fox'
            },
            {
                id:uuid(),
                str:'tom',
            },
            {
                id:uuid(),
                str:'ok jeff'
            },
        ])
    })

    it('should scan contains',async ()=>{

        await runScan(1,{
            str:createFilterExpression({
                contains:'quick',
            })
        },[
            {
                id:uuid(),
                num:1,
                str:'The quick brown fox'
            },
            {
                id:uuid(),
                str:'tom',
            },
        ])
    })

    it('should scan value contains property',async ()=>{

        await runScan(1,{
            str:createFilterExpression({
                valueContainsProperty:'The quick brown fox',
            })
        },[
            {
                id:uuid(),
                num:1,
                str:'quick'
            },
            {
                id:uuid(),
                str:'tom',
            },
        ])
    })

    it('should scan less than',async ()=>{

        await runScan(1,{
            num:createFilterExpression({
                lt:5,
            })
        },[
            {
                id:uuid(),
                num:1,
            },
            {
                id:uuid(),
                num:10,
            },
            {
                id:uuid(),
                num:11,
            },
        ])
    })

    it('should scan less than equal to',async ()=>{

        await runScan(3,{
            num:createFilterExpression({
                lte:3,
            })
        },[
            {
                id:uuid(),
                num:1,
            },
            {
                id:uuid(),
                num:-4,
            },
            {
                id:uuid(),
                num:3,
            },
            {
                id:uuid(),
                num:10,
            },
            {
                id:uuid(),
                num:11,
            },
        ])
    })

    it('should scan more than',async ()=>{

        await runScan(2,{
            num:createFilterExpression({
                mt:5,
            })
        },[
            {
                id:uuid(),
                num:1,
            },
            {
                id:uuid(),
                num:10,
            },
            {
                id:uuid(),
                num:11,
            },
        ])
    })

    it('should scan more than equal to',async ()=>{

        await runScan(2,{
            num:createFilterExpression({
                mte:10,
            })
        },[
            {
                id:uuid(),
                num:3,
            },
            {
                id:uuid(),
                num:10,
            },
            {
                id:uuid(),
                num:11,
            },
        ])
    })

    it('should scan eq size',async ()=>{

        await runScan(3,{
            str:createFilterExpression({
                eq:3,
                size:true
            })
        },[
            {
                id:uuid(),
                str:'abc'
            },
            {
                id:uuid(),
                str:'abcdefghi'
            },
            {
                id:uuid(),
                str:'abcdefghijklmnop'
            },
            {
                id:uuid(),
                str:'xyz'
            },
            {
                id:uuid(),
                str:'nop'
            },
        ])
    })

    it('should scan neq size',async ()=>{

        await runScan(2,{
            str:createFilterExpression({
                neq:3,
                size:true
            })
        },[
            {
                id:uuid(),
                str:'abc'
            },
            {
                id:uuid(),
                str:'abcdefghi'
            },
            {
                id:uuid(),
                str:'abcdefghijklmnop'
            },
        ])
    })

    it('should scan less than size',async ()=>{

        await runScan(1,{
            str:createFilterExpression({
                lt:5,
                size:true
            })
        },[
            {
                id:uuid(),
                str:'abc'
            },
            {
                id:uuid(),
                str:'abcdefghi'
            },
            {
                id:uuid(),
                str:'abcdefghijklmnop'
            },
        ])
    })

    it('should scan less than equal to size',async ()=>{

        await runScan(3,{
            str:createFilterExpression({
                lte:3,
                size:true
            })
        },[
            {
                id:uuid(),
                str:'a'
            },
            {
                id:uuid(),
                str:'ab'
            },
            {
                id:uuid(),
                str:'abc'
            },
            {
                id:uuid(),
                str:'abcdefghi'
            },
            {
                id:uuid(),
                str:'abcdefghijklmnop'
            },
        ])
    })

    it('should scan more than size',async ()=>{

        await runScan(2,{
            str:createFilterExpression({
                mt:5,
                size:true
            })
        },[
            {
                id:uuid(),
                str:'abc'
            },
            {
                id:uuid(),
                str:'abcdefghi'
            },
            {
                id:uuid(),
                str:'abcdefghijklmnop'
            },
        ])
    })

    it('should scan more than equal to size',async ()=>{

        await runScan(2,{
            str:createFilterExpression({
                mte:9,
                size:true
            })
        },[
            {
                id:uuid(),
                str:'a'
            },
            {
                id:uuid(),
                str:'ab'
            },
            {
                id:uuid(),
                str:'abc'
            },
            {
                id:uuid(),
                str:'abcdefghi'
            },
            {
                id:uuid(),
                str:'abcdefghijklmnop'
            },
        ])
    })
});


const EtScheme=z.object({
    id:z.string(),
    str:z.string().optional(),
    num:z.number().optional(),
})

type Et=z.infer<typeof EtScheme>;
