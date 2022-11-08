import { AwsAuthProviders } from "@iyio/aws";
import { authService, BaseUser, createScope, IAuthProviders, MemoryStore, Scope, ScopeModule, shortUuid, storeRoot } from "@iyio/common";
import { fail } from "assert";
import { CognitoAuthProvider, CognitoAuthProviderConfig } from "./CognitoAuthProvider";

export const useTempCognitoUser=async (module:ScopeModule,work:(scope:Scope,user:BaseUser,config:CognitoAuthProviderConfig)=>Promise<void>)=>{

    let provider:CognitoAuthProvider|undefined=undefined;

    const scope=createScope(reg=>{
        reg.use(module);
        provider=reg
            .provideForType(IAuthProviders,scope=>CognitoAuthProvider.fromScope(scope))
            .andFor(AwsAuthProviders)
            .getValue();
    });

    storeRoot(scope).mount('/',new MemoryStore());

    const email=`unit-test.${shortUuid()}@iyio.io`;
    const password='P1!p-'+shortUuid();

    console.log(`Registering ${email}, ${password}`);

    const result=await authService(scope).registerEmailPasswordAsync(email,password);

    if(result.status!=='success'){
        console.log(result);
        fail('Result not success');
        return;
    }

    try{

        await work(scope,result.user,(provider as unknown as CognitoAuthProvider).config);

    }finally{

        const deleteResult=await authService(scope).deleteAsync(result.user);
        if(deleteResult.status==='error'){
            fail('Failed to delete user');
        }else if(deleteResult.status==='pending'){
            console.warn('Delete user pending');
        }else{
            console.log(`${email} deleted`)
        }
    }
}
