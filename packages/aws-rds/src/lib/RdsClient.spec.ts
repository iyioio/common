import { awsModule } from "@iyio/aws";
import { createScope, EnvParamProvider, generateRandomTestStoreItem, parseConfigBool, shortUuid, sql, sqlClient, sqlName, SqlStoreAdapterOptions, testMountedStoreAsync, TestStoreItem } from "@iyio/common";

import { RdsClient } from "./RdsClient";


const keepTable=parseConfigBool(process.env['NX_KEEP_RDS_TEST_TABLES']);
const skipTest=parseConfigBool(process.env['NX_SKIP_RDS_TEST']);
const logQueries=parseConfigBool(process.env['NX_LOG_RDS_TEST_QUERIES']);

if(skipTest){
    describe('!!!!!!!!!!!! skipping RdsStore !!!!!!!!!!!!',()=>{
        it('should do nothing',()=>{
           console.warn('Skipping RdsStore test because NX_SKIP_RDS_TEST is set to true')
        })
    })
}else{



describe('RdsStore',()=>{
    const tableName="TestTable_"+shortUuid().replace(/\W/g,'_');

    const getScope=(storeOptions?:SqlStoreAdapterOptions)=>{

        const scope=createScope(scope=>{
            scope.use(awsModule);
            scope.provideForService(sqlClient,scope=>RdsClient.fromScope(scope,storeOptions));
            scope.provideParams(new EnvParamProvider());
        })
        const client=sqlClient(scope) as RdsClient;
        client.log=logQueries;

        expect(client).toBeInstanceOf(RdsClient);

        return {scope,client:client}

    }

    const timeout=1000*60*3;

    beforeAll(async ()=>{

        const {client}=getScope();

        console.log(`Creating table ${tableName}`)

        console.log('Waking up database. This may take some time.')

        await client.execAsync(sql`
            CREATE TABLE ${sqlName(tableName)} (
                "id" uuid PRIMARY KEY,
                "stringValue" VARCHAR(255),
                "numberValue" int,
                "data" jsonb

            );
        `)
    },timeout);

    afterAll(async ()=>{
        if(keepTable){
            console.log(`Keeping table ${tableName}`)
        }else{
            const {client}=getScope();
            console.log(`Dropping table ${tableName}`)
            await client.execAsync(sql`
                DROP TABLE ${sqlName(tableName)};
            `)
        }

    },timeout)

    const insertReturnAsync=async (client:RdsClient)=>{
        const sourceItem=generateRandomTestStoreItem();

        const item=await client.insertReturnAsync<TestStoreItem>(tableName,sourceItem);

        expect(sourceItem).toEqual(item);

        return {item,sourceItem};
    }

    it('should insert and get record',async ()=>{

        const {client}=getScope();

        await insertReturnAsync(client);

    })

    it('should delete record',async ()=>{

        const {client}=getScope();

        const {item}=await insertReturnAsync(client);

        await client.deleteAsync<TestStoreItem>(tableName,'id',item.id);

        const check=await client.selectFirstOrDefaultAsync(sql`
            SELECT * FROM ${sqlName(tableName)} WHERE "id" = ${item.id} LIMIT 1
        `)

        expect(check).toBeUndefined();

    })

    it('should get as store',async ()=>{

        const {client}=getScope();

        const {item}=await insertReturnAsync(client);

        const item2=await client.getStoreAdapter().getAsync<TestStoreItem>(`${tableName}/${item.id}`);

        expect(item).toEqual(item2);

    })

    it('should get as store with tableName',async ()=>{

        const {client}=getScope({tableName});

        const {item}=await insertReturnAsync(client);

        const item2=await client.getStoreAdapter().getAsync<TestStoreItem>(item.id);

        expect(item).toEqual(item2);

    })

    it('should get as store with tableName and stringValue',async ()=>{

        const {client}=getScope({tableName});

        const {item}=await insertReturnAsync(client);

        const item2=await client.getStoreAdapter().getAsync<TestStoreItem>(`$stringValue/${item.stringValue}`);

        expect(item).toEqual(item2);

    })

    it('should get as store with tableName and numberValue',async ()=>{

        const {client}=getScope({tableName});

        const {item}=await insertReturnAsync(client);

        const item2=await client.getStoreAdapter().getAsync<TestStoreItem>(`$numberValue/${item.numberValue}`);

        expect(item).toEqual(item2);

    })



    it('should meet standard mount operations',async ()=>{

        const {scope,client}=getScope();

        const basePath='sql-data/items/no-table'
        await testMountedStoreAsync(scope,basePath+'/'+tableName,{
            path:basePath,
            store:client.getStoreAdapter()
        })
    })



    it('should meet standard mount operations with tableName',async ()=>{

        const {scope,client}=getScope({tableName});

        const basePath='sql-data/items/with-table'
        await testMountedStoreAsync(scope,basePath,{
            path:basePath,
            store:client.getStoreAdapter()
        })
    })

})



}
