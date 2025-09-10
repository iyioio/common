import { CodeParsingOptions, CodeParsingResult } from "./code-parsing-types.js";

export interface XmlNode
{
    /**
     * Text content nodes will have a name of "text"
     */
    name:string;
    text?:string;
    atts?:Record<string,any>;
    children?:XmlNode[];
}

export interface XmlParsingOptions extends CodeParsingOptions{
    emptyAttValue?:string;
    stopOnFirstNode?:boolean;
    /**
     * If true attribute values that start and end with curly brackets will be parsed as json.
     * The starting and ending brackets will be discarded. A string value that starts and ends with
     * curly brackets can be escaped by starting the string with a backslash.
     */
    parseJsonAtts?:boolean;
}

export type XmlParsingResult=CodeParsingResult<XmlNode[]>;
