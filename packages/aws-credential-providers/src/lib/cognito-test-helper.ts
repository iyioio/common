import { authService, IAuthProviderType, User } from "@iyio/app-common";
import { IAwsAuthType } from "@iyio/aws";
import { createScope, Scope, ScopeModule, shortUuid } from "@iyio/common";
import { MemoryStore, storeService } from "@iyio/key-value-store";
import { fail } from "assert";
import { CognitoAuthProvider, CognitoAuthProviderConfig } from "./CognitoAuthProvider";

export const useTempCognitoUser=async (module:ScopeModule,work:(scope:Scope,user:User,config:CognitoAuthProviderConfig)=>Promise<void>)=>{

    let provider:CognitoAuthProvider|undefined=undefined;

    const scope=createScope(reg=>{
        reg.use(module);
        provider=reg
            .provideForType(IAuthProviderType,scope=>CognitoAuthProvider.fromScope(scope))
            .andFor(IAwsAuthType)
            .getValue();
    });

    scope(storeService).mount('/',new MemoryStore());

    const email=`unit-test.${shortUuid()}@iyio.io`;
    const password='P1!p-'+shortUuid();

    console.log(`Registering ${email}, ${password}`);

    const result=await scope(authService).registerEmailPasswordAsync(email,password);

    if(result.status!=='success'){
        console.log(result);
        fail('Result not success');
        return;
    }

    try{

        await work(scope,result.user,(provider as unknown as CognitoAuthProvider).config);

    }finally{

        const deleteResult=await scope(authService).deleteAsync(result.user);
        if(deleteResult.status==='error'){
            fail('Failed to delete user');
        }else if(deleteResult.status==='pending'){
            console.warn('Delete user pending');
        }else{
            console.log(`${email} deleted`)
        }
    }
}
