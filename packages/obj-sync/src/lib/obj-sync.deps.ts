import { defineNumberParam, defineStringParam } from "@iyio/common";

export const objSyncClientConnectionTableParam=defineStringParam('objSyncClientConnectionTable');
export const objSyncObjStateTableParam=defineStringParam('objSyncObjStateTable');
export const objSyncEndpointParam=defineStringParam('objSyncEndpoint');
/**
 * The length at which log entires will be merged into the state of ObjSyncObjState objects.
 */
export const objSyncAutoMergeLogLengthParam=defineNumberParam('objSyncAutoMergeLogLength',5/*20*/);

export const objSyncCreateDefaultStateFnArnParam=defineStringParam('objSyncCreateDefaultStateFnArn');
export const objSyncTransformClientConnectionFnArnParam=defineStringParam('objSyncTransformClientConnectionFnArn');
