import { authService, createScope, EnvParams, MemoryStore, shortUuid, storeRoot, uuid } from "@iyio/common";
import { cognitoAuthProviderModule } from './_modules.aws-credential-providers';
import { cognitoIdentityPoolIdParam, cognitoUserPoolClientIdParam, cognitoUserPoolIdParam } from './_types.aws-credential-providers';

describe('CognitoAuthProvider',()=>{

    const email=`unit-test.${uuid()}@iyio.io`;
    const password='P1!p-'+shortUuid();

    it('should get config from env',()=>{

        const scope=createScope(reg=>{
            reg.addParams(new EnvParams());
        });


        expect(cognitoIdentityPoolIdParam(scope)).toBeTruthy();
        expect(cognitoUserPoolClientIdParam(scope)).toBeTruthy();
        expect(cognitoUserPoolIdParam(scope)).toBeTruthy();
    })

    it('should register user',async ()=>{

        const scope=createScope(reg=>{
            reg.addParams(new EnvParams());
            cognitoAuthProviderModule(reg);
        });

        const store=storeRoot(scope);
        const auth=authService(scope);

        store.mount('/',new MemoryStore());

        console.log(`Registering ${email}, ${password}`);

        const result=await auth.registerEmailPasswordAsync(email,password);

        if(result.status!=='success'){
            console.log(result);
            fail('Result not success');
            return;
        }

        const deleteResult=await auth.deleteAsync(result.user);
        if(deleteResult.status==='error'){
            fail('Failed to delete user');
            return;
        }else if(deleteResult.status==='pending'){
            console.warn('Delete user pending');
        }else{
            console.log(`${email} deleted`)
        }


    })


})


