import { authService } from "@iyio/app-common";
import { createScope, EnvValueProvider, shortUuid } from "@iyio/common";
import { MemoryStore, storeService } from "@iyio/key-value-store";
import { bootCognitoAuthProvider } from './_boot.aws-credential-providers';
import { cognitoIdentityPoolIdParam, cognitoUserPoolClientIdParam, cognitoUserPoolIdParam } from './_types.aws-credential-providers';

describe('CognitoAuthProvider',()=>{

    const email=`unit-test.${shortUuid()}@iyio.io`;
    const password='P1!p-'+shortUuid();

    it('should get config from env',()=>{

        const scope=createScope();
        scope.provideParams(new EnvValueProvider());

        expect(scope(cognitoIdentityPoolIdParam)).toBeTruthy();
        expect(scope(cognitoUserPoolClientIdParam)).toBeTruthy();
        expect(scope(cognitoUserPoolIdParam)).toBeTruthy();
    })

    it('should register user',async ()=>{

        const scope=createScope();
        scope.provideParams(new EnvValueProvider());

        bootCognitoAuthProvider(scope);

        const store=scope(storeService);
        const auth=scope(authService);

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


