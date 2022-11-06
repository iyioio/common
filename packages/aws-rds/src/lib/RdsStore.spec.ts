import { awsModule } from "@iyio/aws";
import { createScope, EnvParamProvider, HashMap, parseConfigBool, shortUuid, sql, sqlName, sqlService, uuid } from "@iyio/common";
import { RdsStore } from "./RdsStore";

interface Item
{
    id:string;
    stringValue?:string;
    numberValue?:number;
    data?:HashMap;
}

const keepTable=parseConfigBool(process.env['NX_KEEP_RDS_TEST_TABLES']);
const skipTest=parseConfigBool(process.env['NX_SKIP_RDS_TEST']);

if(skipTest){
    describe('!!!!!!!!!!!! skipping RdsStore !!!!!!!!!!!!',()=>{
        it('should do nothing',()=>{
           console.warn('Skipping RdsStore test because NX_SKIP_RDS_TEST is set to true')
        })
    })
}else{



describe('RdsStore',()=>{
    const tableName="TestTable_"+shortUuid().replace(/\W/g,'_');

    const getScope=()=>{

        const scope=createScope(scope=>{
            scope.use(awsModule);
            scope.provideForService(sqlService,scope=>RdsStore.fromScope(scope));
            scope.provideParams(new EnvParamProvider());
        })
        const store=sqlService(scope);

        return {scope,store}

    }

    const timeout=1000*60*3;

    beforeEach(async ()=>{

        const {store}=getScope();

        console.log(`Creating table ${tableName}`)

        console.log('Waking up database. This may take some time.')

        await store.execAsync(sql`
            CREATE TABLE ${sqlName(tableName)} (
                "id" uuid PRIMARY KEY,
                "stringValue" VARCHAR(255),
                "numberValue" int,
                "data" jsonb

            );
        `)
    },timeout);

    afterEach(async ()=>{
        if(keepTable){
            console.log(`Keeping table ${tableName}`)
        }else{
            const {store}=getScope();
            console.log(`Dropping table ${tableName}`)
            await store.execAsync(sql`
                DROP TABLE ${sqlName(tableName)};
            `)
        }

    },timeout)

    it('should insert a record',async ()=>{

        const {store}=getScope();

        const item:Item={
            id:uuid(),
            stringValue:'abc',
            numberValue:77,
            data:{
                ok:'bob',
                noWay:'joe'
            }
        }

        const result=await store.insertReturnAsync<Item>(tableName,item);

        expect(item).toEqual(result);




    })
})
}
