import { createScope, Scope, shortUuid } from "@iyio/common";
import { MemoryStore, storeService } from "@iyio/key-value-store";
import { AuthRegisterStatus } from "./auth-types";
import { MemoryAuthProvider } from './MemoryAuthProvider';
import { authService, currentUser, IAuthProviderType } from './_types.app-common';

describe('MemoryAuthProvider',()=>{

    const email='ricky.bobby@gofast.net';
    const password=shortUuid();

    const getScope=()=>{
        const scope=createScope(reg=>{
            reg.provideForType(IAuthProviderType,()=>new MemoryAuthProvider());
        });
        storeService(scope).mount('/',new MemoryStore())

        return scope;
    }

    const registerAsync=async (scope:Scope,email:string,password:string,keepSignedIn:boolean)=>{

        const auth=scope.require(authService);
        const result=await auth.registerEmailPasswordAsync(email,password);
        expect(result.status).toBe<AuthRegisterStatus>('success');

        const user=result.status==='success'?result.user:undefined;
        if(!user){
            fail('User no in result');
            return;
        }

        expect((await auth.getUserAsync(user.providerData))?.id).toEqual(user.id);
        const value=currentUser(scope);
        expect(value?.id).toEqual(user.id);

        if(!keepSignedIn){
            await auth.signOutAsync();
            expect(currentUser(scope)).toBe(null);
        }

        return user;
    }

    it('should register',async ()=>{

        const scope=getScope();

        await registerAsync(scope,email,password,true);

    });

    it('should sign-out',async ()=>{

        const scope=getScope();

        await registerAsync(scope,email,password,false);

    });

    it('should sign-in',async ()=>{

        const scope=getScope();

        await registerAsync(scope,email,password,false);

        const auth=scope.require(authService);
        const result=await auth.signInEmailPasswordAsync(email,password);
        expect(result.success).toBe(true);

    });

    it('should not sign-in with incorrect password',async ()=>{

        const scope=getScope();

        await registerAsync(scope,email,password,false);

        const auth=scope.require(authService);
        const result=await auth.signInEmailPasswordAsync(email,'incorrect!Pa55w0rd!');
        expect(result.success).toBe(false);

    });

})
