import { createFnHandler } from '@iyio/common';
import { initBackend } from '../obj-sync-handler-lib';

initBackend();

const objSyncSocketDisconnect=async (
    //fnEvt:FnEvent,
    //input:any
):Promise<void>=>{
    console.log('disconnect');
}

export const handler=createFnHandler(objSyncSocketDisconnect,{
    httpLike:true,
    //inputScheme:SpaceModelRequestScheme,
});
