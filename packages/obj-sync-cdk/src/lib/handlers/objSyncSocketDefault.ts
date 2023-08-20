import { dynamoClient } from '@iyio/aws-dynamo';
import { BadRequestError, FnEvent, asArray, createFnHandler } from '@iyio/common';
import { ObjSyncRemoteCommand } from '@iyio/obj-sync';
import { createClientConnectionAsync, initBackend, queueSyncEvtAsync, sendStateToClientAsync } from '../obj-sync-handler-lib';

initBackend();

const objSyncSocketDefault=async (
    fnEvt:FnEvent,
    input:ObjSyncRemoteCommand|ObjSyncRemoteCommand[]
):Promise<void>=>{

    console.log('default',JSON.stringify({input},null,4)); // todo - remove
    dynamoClient().logCommandInput=true; // todo - remove
    dynamoClient().logCommandOutput=true; // todo - remove

    if(!fnEvt.connectionId){
        const msg='fnEvt must define a connectionId in-order to create a new client connection';
        console.error(msg);
        throw new BadRequestError(msg);
    }

    const commands=asArray(input);

    for(const cmd of commands){

        switch(cmd.type){

            case 'createClient':
                await createClientConnectionAsync(cmd,fnEvt.connectionId,fnEvt.sub);
                break;

            case 'get':
                await sendStateToClientAsync(cmd.objId,cmd.clientId,fnEvt.connectionId);
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

}

export const handler=createFnHandler(objSyncSocketDefault,{
    httpLike:true,
    //inputScheme:ObjSyncRemoteCommandScheme,
});

