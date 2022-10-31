import { DependencyContainer, registerConfig } from "@iyio/common";

describe('cognito-auth',()=>{

    it('should create cognito',()=>{
        const deps=new DependencyContainer();

        registerConfig(deps,{

        })

        const config=getConfig(deps);
    })


})
