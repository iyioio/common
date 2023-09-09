import { dynamoClient } from '@iyio/aws-dynamo';
import { BadRequestError, FnEvent, FnEventEventTypeDisconnect, FnEventEventTypeMessage, asArray, createFnHandler } from '@iyio/common';
import { ObjSyncRemoteCommand } from '@iyio/obj-sync';
import { cleanUpSocket, createClientConnectionAsync, initBackend, queueSyncEvtAsync, sendStateToClientAsync } from '../obj-sync-handler-lib';

initBackend();

const objSyncSocketDefault=async (
    fnEvt:FnEvent,
    input:ObjSyncRemoteCommand|ObjSyncRemoteCommand[]|undefined|null
):Promise<void>=>{

    console.log('default',fnEvt.eventType,JSON.stringify({input},null,4)); // todo - remove
    dynamoClient().logCommandInput=true; // todo - remove
    dynamoClient().logCommandOutput=true; // todo - remove

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

