import { RecursiveObjWatchEvt } from '@iyio/common';
import { z } from 'zod';

export const ObjSyncRuleScheme=z.object({
    /**
     * The path that the client is allowed to access. All client paths of the path are also
     * accessible.
     */
    allow:z.array(z.string().or(z.number().int())).optional()
})

export const ObjSyncClientConnectionScheme=z.object({

    /**
     * Id of the client connected
     */
    clientId:z.string(),

    /**
     * Id of the object the connection is tracking
     */
    objId:z.string(),

    /**
     * Id of the websocket connection. Multiple clients connections can share the same websocket
     */
    socketId:z.string(),

    /**
     * If undefined the client has access to the entire object
     */
    rules:ObjSyncRuleScheme.array().optional(),

    userId:z.string().optional(),
})

export type ObjSyncClientConnection=z.infer<typeof ObjSyncClientConnectionScheme>;

/**
 * A close representation of RecursiveObjWatchEvt without generics
 */
export const ObjSyncRecursiveObjWatchEvtScheme=z.object({
    type:z.literal('set'),
    prop:z.string(),
    value:z.any(),
}).or(z.object({
    type:z.literal('delete'),
    prop:z.string(),
})).or(z.object({
    type:z.literal('aryChange'),
    index:z.number().int(),
    deleteCount:z.number().int().optional(),
    values:z.any().array().optional(),
})).or(z.object({
    type:z.literal('aryMove'),
    fromIndex:z.number().int(),
    toIndex:z.number().int(),
    count:z.number().int(),
})).or(z.object({
    type:z.literal('event'),
    eventType:z.string(),
    eventValue:z.any().optional(),
})).or(z.object({
    type:z.literal('change'),
})).or(z.object({
    type:z.literal('load'),
    prop:z.string().optional(),
})).and(z.object({
    path:z.array(z.string().or(z.number().int()).or(z.null())).optional()
}))

export type ObjSyncRecursiveObjWatchEvt=z.infer<typeof ObjSyncRecursiveObjWatchEvtScheme>;

export const ObjSyncObjStateScheme=z.object({

    objId:z.string(),

    changeIndex:z.number().int(),

    state:z.record(z.string(),z.any()),

    log:z.array(ObjSyncRecursiveObjWatchEvtScheme),

})

export type ObjSyncObjState=z.infer<typeof ObjSyncObjStateScheme>;



export const ObjSyncRemoteCommandTypeScheme=z.enum(['delete','get','evt','createClient']);
export type ObjSyncRemoteCommandType=z.infer<typeof ObjSyncRemoteCommandTypeScheme>;


export const ObjSyncRemoteCommandScheme=z.object({

    type:ObjSyncRemoteCommandTypeScheme,

    /**
     * Id of the client connected
     */
    clientId:z.string(),

    /**
     * Id of the object the connection is tracking
     */
    objId:z.string(),

    evts:z.optional(z.array(ObjSyncRecursiveObjWatchEvtScheme)),

    /**
     * When used with a get request the supplied object will be used as the default state if
     * not yet defined
     */
    defaultState:z.optional(z.record(z.string(),z.any())),
})

export type ObjSyncRemoteCommand=z.infer<typeof ObjSyncRemoteCommandScheme>;
export type ScopedObjSyncRemoteCommand=Omit<ObjSyncRemoteCommand,'clientId'|'objId'>;




export const ObjSyncClientCommandTypeScheme=z.enum(['set','delete','evt','reset']);
export type ObjSyncClientCommandType=z.infer<typeof ObjSyncClientCommandTypeScheme>;


export const ObjSyncClientCommandScheme=z.object({

    type:ObjSyncClientCommandTypeScheme,

    /**
     * Id of the client connected
     */
    clientId:z.string(),

    /**
     * Id of the object the connection is tracking
     */
    objId:z.string(),

    evts:z.optional(z.array(ObjSyncRecursiveObjWatchEvtScheme)),

    changeIndex:z.number().int(),

    state:ObjSyncObjStateScheme.optional(),
})

export type ObjSyncClientCommand=z.infer<typeof ObjSyncClientCommandScheme> & {
    evts?:RecursiveObjWatchEvt<any>[];
}
