import { lambdaClient } from "@iyio/aws-lambda";
import { ObjSyncClientConnection, ObjSyncClientConnectionScheme, ObjSyncObjState, ObjSyncObjStateScheme, ObjSyncRemoteCommand, ObjSyncRemoteCommandScheme, objSyncCreateDefaultStateFnArnParam, objSyncTransformClientConnectionFnArnParam } from "@iyio/obj-sync";

export const invokeObjSyncCreateDefaultStateFn=async (input:ObjSyncRemoteCommand):Promise<ObjSyncObjState>=>{

    const fn=objSyncCreateDefaultStateFnArnParam.get();
    if(!fn){
        const stateObj:ObjSyncObjState={
            objId:input.objId,
            changeIndex:0,
            state:input.defaultState??{},
            clientMapProp:input.clientMapProp,
            autoDeleteClientObjects:input.autoDeleteClientObjects,
            log:[],
        }
        return ObjSyncObjStateScheme.parse(stateObj);
    }

    return await lambdaClient().invokeAsync<ObjSyncRemoteCommand,ObjSyncObjState>({
        label:"ObjSyncCreateDefaultStateFn",
        fn,
        input,
        inputScheme:ObjSyncRemoteCommandScheme,
        outputScheme:ObjSyncObjStateScheme
    })
}


export const invokeObjSyncTransformClientConnectionFn=async (input:ObjSyncClientConnection):Promise<ObjSyncClientConnection>=>{

    const fn=objSyncTransformClientConnectionFnArnParam.get();
    if(!fn){
        return ObjSyncClientConnectionScheme.parse(input);
    }


    return await lambdaClient().invokeAsync<ObjSyncClientConnection,ObjSyncClientConnection>({
        label:"ObjSyncTransformClientConnectionFn",
        fn,
        input,
        inputScheme:ObjSyncClientConnectionScheme,
        outputScheme:ObjSyncClientConnectionScheme
    })
}
