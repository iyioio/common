import { awsModule } from '@iyio/aws';
import { useTempCognitoUser } from '@iyio/aws-credential-providers';
import { createScope, defineStringParam, EnvParams, httpClient as http } from "@iyio/common";
import { nodeCommonModule } from "@iyio/node-common";

const authFuncUrl=defineStringParam('authFuncUrl');

describe('http-cognito',()=>{

    it('should fail to make auth call',async ()=>{
        const scope=createScope(scope=>{
            scope.use(nodeCommonModule);
            scope.addParams(new EnvParams())
        });

        const httpClient=http(scope);

        const url=authFuncUrl(scope);

        const r=await httpClient.requestAsync<Response>(
            'GET',url,undefined,{returnFetchResponse:true});

        expect(r?.status).toBe(403);


    })

    it('should make auth call',async ()=>{

        await useTempCognitoUser(scope=>{
            scope.use(nodeCommonModule);
            scope.use(awsModule);
            scope.addParams(new EnvParams())
        },async scope=>{
            const httpClient=http(scope);

            const url=authFuncUrl(scope);

            const r=await httpClient.requestAsync<Response>(
                'GET',url,undefined,{returnFetchResponse:true});

            expect(r?.ok).toBe(true);
        });




    })
})
