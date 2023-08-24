import { EnvParams, createScope, deepCompare, delayAsync, secondMs, shortUuid, wAryMove, wAryPush, wSetProp } from '@iyio/common';
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

    const defaultSameTimeout=1000;
    let sameTimeout=defaultSameTimeout;
    let logSameError=true;
    const expectSameAsync=async (task:string,obj:any,...objs:any[])=>{
        const start=Date.now();
        while(true){
            let diffI:number|undefined;
            for(let i=0;i<objs.length;i++){
                if(!deepCompare(obj,objs[i])){
                    diffI=i;
                }
            }
            if(diffI===undefined){
                return;
            }else if((Date.now()-start)>sameTimeout){
                const msg=`${task} - obj states do not match at objs index ${diffI}`;
                if(logSameError){
                    console.error(msg,JSON.stringify({
                        obj,
                        ['obj'+diffI]:obj[diffI]
                    },null,4))
                }
                throw new Error(msg);
            }else{
                await delayAsync(1);
            }
        }
    }

    it('should connect',async ()=>{

        const {client}=createClient();

        await Promise.race([
            client.connectAsync(),
            delayAsync(5000)
        ]);

        expect(client.isReady).toBe(true);

    },testTimeout);

    it('should fail expectSameAsync',async ()=>{
        sameTimeout=50;
        logSameError=false;
        try{
            await expectSameAsync('fail',{a:1},{b:2});
            throw new Error('expectSameAsync should have failed')
        }catch{
            //
        }finally{
            sameTimeout=defaultSameTimeout;
            logSameError=true;
        }
    })

    it('should stay in sync',async ()=>{

        const {state,objId}=await createClientAsync();
        const {state:stateB,objId:objIdB}=await createClientAsync(objId);

        expect(objId).toBe(objIdB);

        wSetProp(state,'prop1',77);
        wSetProp(state,'prop2',88);
        wSetProp(state,'prop3',99);

        expect(state['prop1']).toBe(77);
        expect(state['prop2']).toBe(88);
        expect(state['prop3']).toBe(99);

        await expectSameAsync('77',state,stateB);


        const {state:stateC}=await createClientAsync(objId);

        expect(deepCompare(state,stateC)).toBe(true);

        await expectSameAsync('clientC',state,stateB,stateC);

        const ary:any[]=[1,2,3];

        wSetProp(state,'ary',ary);
        await expectSameAsync('set ary',state,stateB,stateC);


        wAryPush(ary,'a','b','c');
        await expectSameAsync('ary push',state,stateB,stateC);
        expect(deepCompare(state['ary'],[1,2,3,'a','b','c']));

        wAryMove(ary,2,4);
        await expectSameAsync('ary move',state,stateB,stateC);
        expect(deepCompare(state['ary'],[1,2,'a','b',3,'c']));
    })

})
