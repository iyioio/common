import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { autoPackageIndexPlugin } from "./plugins/autoPackageIndexPlugin";
import { bucketPlugin } from "./plugins/bucketPlugin";
import { fileReader } from "./plugins/fileReader";
import { fileWriter } from "./plugins/fileWriter";
import { functionPlugin } from "./plugins/functionPlugin";
import { markdownParser } from "./plugins/markdownParser";
import { paramPlugin } from "./plugins/paramPlugin";
import { reactCompPlugin } from "./plugins/reactCompPlugin";
import { serverFnPlugin } from "./plugins/serverFnPlugin";
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
            name:'userPoolPlugin',
            source:'@',
            paths:[],
            plugin:userPoolPlugin
        },
        {
            name:'serverFnPlugin',
            source:'@',
            paths:[],
            plugin:serverFnPlugin
        },
        {
            name:'bucketPlugin',
            source:'@',
            paths:[],
            plugin:bucketPlugin
        },
        {
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
