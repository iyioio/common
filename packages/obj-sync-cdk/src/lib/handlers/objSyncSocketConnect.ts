import { createFnHandler } from '@iyio/common';
import { initBackend } from '../obj-sync-handler-lib';

initBackend();

const objSyncSocketConnect=async (
    //fnEvt:FnEvent,
    //input:any
):Promise<void>=>{
    console.log('connect');
}

export const handler=createFnHandler(objSyncSocketConnect,{
    httpLike:true,
    //inputScheme:SpaceModelRequestScheme,
});
