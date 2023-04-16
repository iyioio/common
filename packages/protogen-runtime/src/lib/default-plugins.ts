import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { autoPackageIndexPlugin } from "./plugins/autoPackageIndexPlugin";
import { fileReader } from "./plugins/fileReader";
import { fileWriter } from "./plugins/fileWriter";
import { functionPlugin } from "./plugins/functionPlugin";
import { markdownParser } from "./plugins/markdownParser";
import { reactCompPlugin } from "./plugins/reactCompPlugin";
import { serverFnPlugin } from "./plugins/serverFnPlugin";
import { tablePlugin } from "./plugins/tablePlugin";
import { tsConfigPlugin } from "./plugins/tsConfigPathsPlugin";
import { tsProtoNodePlugin } from "./plugins/tsProtoNodePlugin";
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
            name:'reactPlugin',
            source:'@',
            paths:[],
            plugin:reactCompPlugin
        },
        {
            name:'serverFnPlugin',
            source:'@',
            paths:[],
            plugin:serverFnPlugin
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
