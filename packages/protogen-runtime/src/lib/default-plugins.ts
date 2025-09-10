import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { actionPlugin } from "./plugins/actionPlugin.js";
import { assignPlugin } from "./plugins/assignPlugin.js";
import { autoPackageIndexPlugin } from "./plugins/autoPackageIndexPlugin.js";
import { callablePlugin } from "./plugins/callablePlugin.js";
import { fileReader } from "./plugins/fileReader.js";
import { fileWriter } from "./plugins/fileWriter.js";
import { functionPlugin } from "./plugins/functionPlugin.js";
import { markdownParser } from "./plugins/markdownParser.js";
import { packagePlugin } from "./plugins/packagePlugin.js";
import { paramPlugin } from "./plugins/paramPlugin.js";
import { reactCompPlugin } from "./plugins/reactCompPlugin.js";
import { sqlMigrationsPlugin } from "./plugins/sqlMigrationsPlugin.js";
import { sqlTablePlugin } from "./plugins/sqlTablePlugin.js";
import { tablePlugin } from "./plugins/tablePlugin.js";
import { tsConfigPlugin } from "./plugins/tsConfigPathsPlugin.js";
import { tsProtoNodePlugin } from "./plugins/tsProtoNodePlugin.js";
import { zodPlugin } from "./plugins/zodPlugin.js";

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
