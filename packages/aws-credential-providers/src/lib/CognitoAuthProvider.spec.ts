import { auth, IAuthProviderRef } from "@iyio/app-common";
import { DependencyContainer, EnvConfig, registerConfig, shortUuid } from "@iyio/common";
import { MemoryStore, store } from "@iyio/key-value-store";
import { CognitoAuthProvider } from './CognitoAuthProvider';
import { COGNITO_IDENTITY_POOL_ID, COGNITO_USER_POOL_CLIENT_ID, COGNITO_USER_POOL_ID } from './_config.aws-credential-providers';

describe('CognitoAuthProvider',()=>{

    const email=`unit-test.${shortUuid()}@iyio.io`;
    const password='P1!p-'+shortUuid();

    it('should get config from env',()=>{

        const deps=new DependencyContainer();
        registerConfig(deps,new EnvConfig());

        expect(COGNITO_IDENTITY_POOL_ID.get(deps)).toBeTruthy();
        expect(COGNITO_USER_POOL_CLIENT_ID.get(deps)).toBeTruthy();
        expect(COGNITO_USER_POOL_ID.get(deps)).toBeTruthy();
    })

    it('should register user',async ()=>{

        const deps=new DependencyContainer();
        registerConfig(deps,new EnvConfig());
        deps.registerValue(IAuthProviderRef,new CognitoAuthProvider(deps));
        store(deps).mount('/',new MemoryStore());

        console.log(`Registering ${email}, ${password}`);

        const result=await auth(deps).registerEmailPasswordAsync(email,password);

        if(result.status!=='success'){
            console.log(result);
            fail('Result not success');
            return;
        }

        const deleteResult=await auth(deps).deleteAsync(result.user);
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
