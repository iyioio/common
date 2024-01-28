import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { actionPlugin } from "./plugins/actionPlugin";
import { aiCompletionPlugin } from "./plugins/aiCompletionPlugin";
import { apiPlugin } from "./plugins/api";
import { assignPlugin } from "./plugins/assignPlugin";
import { autoPackageIndexPlugin } from "./plugins/autoPackageIndexPlugin";
import { bucketPlugin } from "./plugins/bucketPlugin";
import { callablePlugin } from "./plugins/callablePlugin";
import { containerPlugin } from "./plugins/container";
import { fileReader } from "./plugins/fileReader";
import { fileWriter } from "./plugins/fileWriter";
import { functionPlugin } from "./plugins/functionPlugin";
import { markdownParser } from "./plugins/markdownParser";
import { nextJsAppPlugin } from "./plugins/nextJsAppPlugin";
import { nextJsPagePlugin } from "./plugins/nextJsPagePlugin";
import { packagePlugin } from "./plugins/packagePlugin";
import { paramPlugin } from "./plugins/paramPlugin";
import { queuePlugin } from "./plugins/queuePlugin";
import { reactCompPlugin } from "./plugins/reactCompPlugin";
import { secretPlugin } from "./plugins/secretPlugin";
import { serverFnPlugin } from "./plugins/serverFnPlugin";
import { sqlClusterPlugin } from "./plugins/sqlClusterPlugin";
import { sqlMigrationsPlugin } from "./plugins/sqlMigrationsPlugin";
import { sqlTablePlugin } from "./plugins/sqlTablePlugin";
import { tablePlugin } from "./plugins/tablePlugin";
import { tsConfigPlugin } from "./plugins/tsConfigPathsPlugin";
import { tsProtoNodePlugin } from "./plugins/tsProtoNodePlugin";
import { userPoolPlugin } from "./plugins/userPoolPlugin";
import { zodPlugin } from "./plugins/zodPlugin";

export const getDefaultProtoPipelinePlugins=():ProtoPipelinePluginInfo[]=>{
    return [

        //// Read
        {
            name:'fileReader',
            source:'@',
            paths:[],
            plugin:{
                input:fileReader
            }
        },

        //// Parse
        {
            name:'markdownParser',
            source:'@',
            paths:[],
            plugin:{
                parse:markdownParser
            }
        },

        //// Generate
        {
            name:'packagePlugin',
            source:'@',
            paths:[],
            plugin:packagePlugin
        },
        {
            name:'tsProtoNodePlugin',
            source:'@',
            paths:[],
            plugin:tsProtoNodePlugin
        },
        {
            name:'zodPlugin',
            source:'@',
            paths:[],
            plugin:zodPlugin
        },
        {
            name:'functionPlugin',
            source:'@',
            paths:[],
            plugin:functionPlugin
        },
        {
            name:'tablePlugin',
            source:'@',
            paths:[],
            plugin:tablePlugin
        },
        {
            name:'sqlTablePlugin',
            source:'@',
            paths:[],
            plugin:sqlTablePlugin
        },
        {
            name:'actionPlugin',
            source:'@',
            paths:[],
            plugin:actionPlugin
        },
        {
            name:'reactPlugin',
            source:'@',
            paths:[],
            plugin:reactCompPlugin
        },
        {
            name:'userPoolPlugin',
            source:'@',
            paths:[],
            plugin:userPoolPlugin
        },
        {
            name:'secretPlugin',
            source:'@',
            paths:[],
            plugin:secretPlugin
        },
        {
            name:'serverFnPlugin',
            source:'@',
            paths:[],
            plugin:serverFnPlugin
        },
        {
            name:'aiCompletionPlugin',
            source:'@',
            paths:[],
            plugin:aiCompletionPlugin
        },
        {
            name:'bucketPlugin',
            source:'@',
            paths:[],
            plugin:bucketPlugin
        },
        {
            name:'queuePlugin',
            source:'@',
            paths:[],
            plugin:queuePlugin
        },
        {
            name:'sqlClusterPlugin',
            source:'@',
            paths:[],
            plugin:sqlClusterPlugin
        },
        {
            name:'callablePlugin',
            source:'@',
            paths:[],
            plugin:callablePlugin
        },
        {
            name:'nextJsAppPlugin',
            source:'@',
            paths:[],
            plugin:nextJsAppPlugin
        },
        {
            name:'nextJsPagePlugin',
            source:'@',
            paths:[],
            plugin:nextJsPagePlugin
        },
        {
            name:'assignPlugin',
            source:'@',
            paths:[],
            plugin:assignPlugin
        },
        {
            name:'apiPlugin',
            source:'@',
            paths:[],
            plugin:apiPlugin
        },
        {
            name:'containerPlugin',
            source:'@',
            paths:[],
            plugin:containerPlugin
        },
        {
            name:'sqlMigrationsPlugin',
            source:'@',
            paths:[],
            plugin:sqlMigrationsPlugin
        },
        {// should always be the second to last generator
            name:'paramPlugin',
            source:'@',
            paths:[],
            plugin:paramPlugin
        },
        {// should always be the last generator
            name:'autoPackageIndexPlugin',
            source:'@',
            paths:[],
            plugin:autoPackageIndexPlugin
        },

        //// Write
        {
            name:'fileWriter',
            source:'@',
            paths:[],
            plugin:{
                output:fileWriter
            }
        },
        {
            name:'tsConfigPlugin',
            source:'@',
            paths:[],
            plugin:tsConfigPlugin
        },
    ];
}
