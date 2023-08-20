import { EnvParams, createScope, deepCompare, delayAsync, secondMs, shortUuid, wSetProp } from '@iyio/common';
import { nodeWsModule } from '@iyio/node-common';
import { ObjSyncWebsocketClient } from './ObjSyncWebsocketClient';

const testTimeout=secondMs*30;

describe('obj-sync',()=>{

    const createClient=(objId=shortUuid())=>{
        const scope=createScope(reg=>{
            reg.addParams(new EnvParams());
            reg.use(nodeWsModule);
        });
        const clientId=shortUuid();
        const state:Record<string,any>={};

        const client=ObjSyncWebsocketClient.fromScope(scope,{
            objId,
            clientId,
            state,
        });

        return {scope,objId,clientId,state,client}
    }

    const createClientAsync=async (objId?:string)=>{
        const props=createClient(objId);
        await props.client.connectAsync();
        return props;
    }

    it('should connect',async ()=>{

        const {client}=createClient();

        await Promise.race([
            client.connectAsync(),
            delayAsync(5000)
        ]);

        expect(client.isReady).toBe(true);

    },testTimeout);

    it('should set prop',async ()=>{

        const {client,state,objId}=await createClientAsync();
        const {client:clientB,state:stateB,objId:objIdB}=await createClientAsync(objId);

        expect(objId).toBe(objIdB);

        let lastChangeIndex=client.changeIndex;
        let lastChangeIndexB=clientB.changeIndex;

        wSetProp(state,'prop1',77);
        wSetProp(state,'prop2',88);
        wSetProp(state,'prop3',99);

        expect(state['prop1']).toBe(77);
        expect(state['prop2']).toBe(88);
        expect(state['prop3']).toBe(99);

        while(client.changeIndex===lastChangeIndex || clientB.changeIndex===lastChangeIndexB){
            await delayAsync(1);
        }

        lastChangeIndex=client.changeIndex;
        lastChangeIndexB=clientB.changeIndex;

        expect(deepCompare(state,stateB)).toBe(true);


        const {state:stateC}=await createClientAsync(objId);


        expect(deepCompare(state,stateC)).toBe(true);
    })

})
