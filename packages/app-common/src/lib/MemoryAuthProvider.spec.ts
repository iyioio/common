import { DependencyContainer, shortUuid } from "@iyio/common";
import { MemoryStore, store } from "@iyio/key-value-store";
import { AuthRegisterStatus } from "./auth-types";
import { MemoryAuthProvider } from './MemoryAuthProvider';
import { IAuthProviderRef } from './_ref.app-common';
import { auth, usr } from './_service.app-common';

describe('MemoryAuthProvider',()=>{

    const email='ricky.bobby@gofast.net';
    const password=shortUuid();

    const getDeps=()=>{
        const deps=new DependencyContainer();
        store(deps).mount('/',new MemoryStore())
        deps.registerSingleton(IAuthProviderRef,()=>new MemoryAuthProvider());
        return deps;
    }

    const registerAsync=async (deps:DependencyContainer,email:string,password:string,keepSignedIn:boolean)=>{

        const result=await auth(deps).registerEmailPasswordAsync(email,password);
        expect(result.status).toBe<AuthRegisterStatus>('success');

        const user=result.status==='success'?result.user:undefined;
        if(!user){
            fail('User no in result');
            return;
        }

        expect((await auth(deps).getUserAsync(user.providerData))?.id).toEqual(user.id);
        expect(usr(deps)?.id).toEqual(user.id);

        if(!keepSignedIn){
            await auth(deps).signOutAsync();
            expect(usr(deps)).toBe(null);
        }

        return user;
    }

    it('should register',async ()=>{

        const deps=getDeps();

        await registerAsync(deps,email,password,true);

    });

    it('should sign-out',async ()=>{

        const deps=getDeps();

        await registerAsync(deps,email,password,false);

    });

    it('should sign-in',async ()=>{

        const deps=getDeps();

        await registerAsync(deps,email,password,false);

        const result=await auth(deps).signInEmailPasswordAsync(email,password);
        expect(result.success).toBe(true);

    });

    it('should not sign-in with incorrect password',async ()=>{

        const deps=getDeps();

        await registerAsync(deps,email,password,false);

        const result=await auth(deps).signInEmailPasswordAsync(email,'incorrect!Pa55w0rd!');
        expect(result.success).toBe(false);

    });

})
