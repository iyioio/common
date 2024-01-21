import { BadRequestError, FnEvent, FnEventEventTypeDisconnect, FnEventEventTypeMessage, asArray, createFnHandler } from '@iyio/common';
import { ObjSyncClientCommand, ObjSyncRemoteCommand } from '@iyio/obj-sync';
import { cleanUpSocket, createClientConnectionAsync, initBackend, isSocketRegistered, queueSyncEvtAsync, sendData, sendStateToClientAsync } from '../obj-sync-handler-lib';

initBackend();

const objSyncSocketDefault=async (
    fnEvt:FnEvent,
    input:ObjSyncRemoteCommand|ObjSyncRemoteCommand[]|undefined|null
):Promise<void>=>{

    if(!fnEvt.connectionId){
        const msg='fnEvt must define a connectionId in-order to create a new client connection';
        console.error(msg);
        throw new BadRequestError(msg);
    }

    if(fnEvt.eventType===FnEventEventTypeMessage && input){

        const commands=asArray(input);

        for(const cmd of commands){

            switch(cmd.type){

                case 'createClient':
                    await createClientConnectionAsync(cmd,fnEvt.connectionId,fnEvt.sub);
                    break;

                case 'simCleanUp':
                    await cleanUpSocket(fnEvt.connectionId);
                    break;

                case 'get':
                    await sendStateToClientAsync(fnEvt.connectionId,cmd);
                    break;

                case 'evt':
                    if(!cmd.evts){
                        console.error('Evt command must define the evt prop');
                        throw new BadRequestError('Evt command must define the evt prop');
                    }
                    await queueSyncEvtAsync(cmd.objId,cmd.clientId,fnEvt.connectionId,cmd.evts);
                    break;

                case 'ping':
                    if(cmd.pc && !await isSocketRegistered(fnEvt.connectionId)){
                        await sendData<ObjSyncClientCommand>(fnEvt.connectionId,{
                            type:'reconnect',
                            clientId:cmd.clientId,
                            objId:cmd.objId,
                            changeIndex:0,
                        });
                        return;
                    }

                    await sendData<ObjSyncClientCommand>(fnEvt.connectionId,{
                        type:'pong',
                        clientId:cmd.clientId,
                        objId:cmd.objId,
                        changeIndex:0,
                    })
                    break;
            }

        }
    }else if(fnEvt.eventType===FnEventEventTypeDisconnect){
        await cleanUpSocket(fnEvt.connectionId);
    }

}

export const handler=createFnHandler(objSyncSocketDefault,{
    httpLike:true,
    //inputScheme:ObjSyncRemoteCommandScheme,
});

