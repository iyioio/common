import { auth, IAuthProviderRef, User } from "@iyio/app-common";
import { IAwsAuthRef } from "@iyio/aws";
import { DependencyContainer, shortUuid } from "@iyio/common";
import { MemoryStore, store } from "@iyio/key-value-store";
import { CognitoAuthProvider, CognitoAuthProviderConfig } from "./CognitoAuthProvider";

export const useTempCognitoUser=async (deps:DependencyContainer,work:(user:User,config:CognitoAuthProviderConfig)=>Promise<void>)=>{

    const config=CognitoAuthProvider.configFromDeps(deps)
    const provider=new CognitoAuthProvider(config);

    deps.registerValue(IAuthProviderRef,provider);
    deps.registerValue(IAwsAuthRef,provider);

    store(deps).mount('/',new MemoryStore());

    const email=`unit-test.${shortUuid()}@iyio.io`;
    const password='P1!p-'+shortUuid();

    console.log(`Registering ${email}, ${password}`);

    const result=await auth(deps).registerEmailPasswordAsync(email,password);

    if(result.status!=='success'){
        console.log(result);
        fail('Result not success');
        return;
    }

    try{

        await work(result.user,config);

    }finally{

        const deleteResult=await auth(deps).deleteAsync(result.user);
        if(deleteResult.status==='error'){
            fail('Failed to delete user');
        }else if(deleteResult.status==='pending'){
            console.warn('Delete user pending');
        }else{
            console.log(`${email} deleted`)
        }
    }
}
