import { AwsAuthProviders } from "@iyio/aws";
import { AuthProviders, authService, BaseUser, createScope, MemoryStore, Scope, ScopeModule, shortUuid, storeRoot, uuid } from "@iyio/common";
import { CognitoAuthProvider, CognitoAuthProviderConfig } from "./CognitoAuthProvider";

export const useTempCognitoUser=async (module:ScopeModule,work:(scope:Scope,user:BaseUser,config:CognitoAuthProviderConfig)=>Promise<void>)=>{

    let provider:CognitoAuthProvider|undefined=undefined;

    const scope=createScope(reg=>{
        reg.use(module);
        provider=reg
            .addProvider(AuthProviders,scope=>CognitoAuthProvider.fromScope(scope))
            .and(AwsAuthProviders)
            .getValue();
    });

    storeRoot(scope).mount('/',new MemoryStore());

    const email=`unit-test.${uuid()}@iyio.io`;
    const password='P1!p-'+shortUuid();

    console.log(`Registering ${email}, ${password}`);

    const result=await authService(scope).registerEmailPasswordAsync(email,password);

    if(result.status!=='success'){
        console.log(result);
        throw new Error('Result not success');
    }

    try{

        await work(scope,result.user,(provider as unknown as CognitoAuthProvider).config);

    }finally{

        const deleteResult=await authService(scope).deleteAsync(result.user);
        if(deleteResult.status==='error'){
            // eslint-disable-next-line no-unsafe-finally
            throw new Error('Failed to delete user');
        }else if(deleteResult.status==='pending'){
            console.warn('Delete user pending');
        }else{
            console.log(`${email} deleted`)
        }
    }
}
