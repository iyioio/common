import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { actionPlugin } from "./plugins/actionPlugin";
import { assignPlugin } from "./plugins/assignPlugin";
import { autoPackageIndexPlugin } from "./plugins/autoPackageIndexPlugin";
import { callablePlugin } from "./plugins/callablePlugin";
import { fileReader } from "./plugins/fileReader";
import { fileWriter } from "./plugins/fileWriter";
import { functionPlugin } from "./plugins/functionPlugin";
import { markdownParser } from "./plugins/markdownParser";
import { packagePlugin } from "./plugins/packagePlugin";
import { paramPlugin } from "./plugins/paramPlugin";
import { reactCompPlugin } from "./plugins/reactCompPlugin";
import { sqlMigrationsPlugin } from "./plugins/sqlMigrationsPlugin";
import { sqlTablePlugin } from "./plugins/sqlTablePlugin";
import { tablePlugin } from "./plugins/tablePlugin";
import { tsConfigPlugin } from "./plugins/tsConfigPathsPlugin";
import { tsProtoNodePlugin } from "./plugins/tsProtoNodePlugin";
import { zodPlugin } from "./plugins/zodPlugin";

export const getDefaultProtoPipelinePlugins=():ProtoPipelinePluginInfo[]=>{
    return [

        //// Read
        {
            order:100,
            name:'fileReader',
            source:'@',
            paths:[],
            plugin:{
                input:fileReader
            }
        },

        //// Parse
        {
            order:200,
            name:'markdownParser',
            source:'@',
            paths:[],
            plugin:{
                parse:markdownParser
            }
        },

        //// Generate
        {
            order:300,
            name:'packagePlugin',
            source:'@',
            paths:[],
            plugin:packagePlugin
        },
        {
            order:400,
            name:'tsProtoNodePlugin',
            source:'@',
            paths:[],
            plugin:tsProtoNodePlugin
        },
        {
            order:500,
            name:'zodPlugin',
            source:'@',
            paths:[],
            plugin:zodPlugin
        },
        {
            order:600,
            name:'functionPlugin',
            source:'@',
            paths:[],
            plugin:functionPlugin
        },
        {
            order:600,
            name:'tablePlugin',
            source:'@',
            paths:[],
            plugin:tablePlugin
        },
        {
            order:600,
            name:'sqlTablePlugin',
            source:'@',
            paths:[],
            plugin:sqlTablePlugin
        },
        {
            order:600,
            name:'actionPlugin',
            source:'@',
            paths:[],
            plugin:actionPlugin
        },
        {
            order:600,
            name:'reactPlugin',
            source:'@',
            paths:[],
            plugin:reactCompPlugin
        },
        {
            order:600,
            name:'callablePlugin',
            source:'@',
            paths:[],
            plugin:callablePlugin
        },
        {
            order:600,
            name:'assignPlugin',
            source:'@',
            paths:[],
            plugin:assignPlugin
        },
        {
            order:600,
            name:'sqlMigrationsPlugin',
            source:'@',
            paths:[],
            plugin:sqlMigrationsPlugin
        },
        {// should always be the second to last generator
            order:1000,
            name:'paramPlugin',
            source:'@',
            paths:[],
            plugin:paramPlugin
        },
        {// should always be the last generator
            order:1100,
            name:'autoPackageIndexPlugin',
            source:'@',
            paths:[],
            plugin:autoPackageIndexPlugin
        },

        //// Write
        {
            order:2000,
            name:'fileWriter',
            source:'@',
            paths:[],
            plugin:{
                output:fileWriter
            }
        },
        {
            order:2100,
            name:'tsConfigPlugin',
            source:'@',
            paths:[],
            plugin:tsConfigPlugin
        },
    ];
}
