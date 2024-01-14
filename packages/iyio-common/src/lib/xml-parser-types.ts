import { CodeParsingOptions, CodeParsingResult } from "./code-parsing-types";

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
}

export type XmlParsingResult=CodeParsingResult<XmlNode[]>;
