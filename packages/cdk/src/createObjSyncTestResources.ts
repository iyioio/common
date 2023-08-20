import { ManagedStack } from "@iyio/cdk-common";
import { ObjSyncConstruct } from '@iyio/obj-sync-cdk';

export const createObjSyncTestResources=(stack:ManagedStack)=>{

    new ObjSyncConstruct(stack,'Sync',{managed:stack.managed});
}
