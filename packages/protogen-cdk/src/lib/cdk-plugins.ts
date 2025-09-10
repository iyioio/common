import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { aiCompletionPlugin } from "./plugins/aiCompletionPlugin.js";
import { apiPlugin } from "./plugins/api.js";
import { bucketPlugin } from "./plugins/bucketPlugin.js";
import { containerPlugin } from "./plugins/container.js";
import { nextJsAppPlugin } from "./plugins/nextJsAppPlugin.js";
import { nextJsPagePlugin } from "./plugins/nextJsPagePlugin.js";
import { queuePlugin } from "./plugins/queuePlugin.js";
import { secretPlugin } from "./plugins/secretPlugin.js";
import { serverFnPlugin } from "./plugins/serverFnPlugin.js";
import { sqlClusterPlugin } from "./plugins/sqlClusterPlugin.js";
import { userPoolPlugin } from "./plugins/userPoolPlugin.js";

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
