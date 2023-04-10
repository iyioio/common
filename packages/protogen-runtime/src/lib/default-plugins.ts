import { ProtoPipelinePluginInfo } from "@iyio/protogen";
import { fileReader } from "./plugins/fileReader";
import { fileWriter } from "./plugins/fileWriter";
import { functionPlugin } from "./plugins/functionPlugin";
import { lucidCsvParser } from "./plugins/lucidCsvParser";
import { markdownParser } from "./plugins/markdownParser";
import { reactCompPlugin } from "./plugins/reactCompPlugin";
import { tablePlugin } from "./plugins/tablePlugin";
import { tsConfigPlugin } from "./plugins/tsConfigPathsPlugin";
import { zodPlugin } from "./plugins/zodPlugin";

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
