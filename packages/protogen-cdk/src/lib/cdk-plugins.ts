import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { aiCompletionPlugin } from "./plugins/aiCompletionPlugin";
import { apiPlugin } from "./plugins/api";
import { bucketPlugin } from "./plugins/bucketPlugin";
import { containerPlugin } from "./plugins/container";
import { nextJsAppPlugin } from "./plugins/nextJsAppPlugin";
import { nextJsPagePlugin } from "./plugins/nextJsPagePlugin";
import { queuePlugin } from "./plugins/queuePlugin";
import { secretPlugin } from "./plugins/secretPlugin";
import { serverFnPlugin } from "./plugins/serverFnPlugin";
import { sqlClusterPlugin } from "./plugins/sqlClusterPlugin";
import { userPoolPlugin } from "./plugins/userPoolPlugin";

export const getCdkProtoPipelinePlugins=():ProtoPipelinePluginInfo[]=>{
    return [
        {
            order:600,
            name:'userPoolPlugin',
            source:'@',
            paths:[],
            plugin:userPoolPlugin
        },
        {
            order:600,
            name:'secretPlugin',
            source:'@',
            paths:[],
            plugin:secretPlugin
        },
        {
            order:600,
            name:'serverFnPlugin',
            source:'@',
            paths:[],
            plugin:serverFnPlugin
        },
        {
            order:600,
            name:'aiCompletionPlugin',
            source:'@',
            paths:[],
            plugin:aiCompletionPlugin
        },
        {
            order:600,
            name:'bucketPlugin',
            source:'@',
            paths:[],
            plugin:bucketPlugin
        },
        {
            order:600,
            name:'queuePlugin',
            source:'@',
            paths:[],
            plugin:queuePlugin
        },
        {
            order:600,
            name:'sqlClusterPlugin',
            source:'@',
            paths:[],
            plugin:sqlClusterPlugin
        },
        {
            order:600,
            name:'nextJsAppPlugin',
            source:'@',
            paths:[],
            plugin:nextJsAppPlugin
        },
        {
            order:600,
            name:'nextJsPagePlugin',
            source:'@',
            paths:[],
            plugin:nextJsPagePlugin
        },
        {
            order:600,
            name:'apiPlugin',
            source:'@',
            paths:[],
            plugin:apiPlugin
        },
        {
            order:600,
            name:'containerPlugin',
            source:'@',
            paths:[],
            plugin:containerPlugin
        },
    ];
}
