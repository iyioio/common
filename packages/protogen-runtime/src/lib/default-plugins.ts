import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { fileReader } from "./fileReader";
import { fileWriter } from "./fileWriter";
import { functionPlugin } from "./functionPlugin";
import { lucidCsvParser } from "./lucidCsvParser";
import { markdownParser } from "./markdownParser";
import { reactCompPlugin } from "./reactCompPlugin";
import { tablePlugin } from "./tablePlugin";
import { tsConfigPlugin } from "./tsConfigPathsPlugin";
import { zodPlugin } from "./zodPlugin";

export const getDefaultProtoPipelinePlugins=():ProtoPipelinePluginInfo[]=>{
    return [
        {
            name:'fileReader',
            source:'@',
            paths:[],
            plugin:{
                input:fileReader
            }
        },
        {
            name:'markdownParser',
            source:'@',
            paths:[],
            plugin:{
                parse:markdownParser
            }
        },
        {
            name:'lucidCsvParser',
            source:'@',
            paths:[],
            plugin:{
                parse:lucidCsvParser
            }
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
