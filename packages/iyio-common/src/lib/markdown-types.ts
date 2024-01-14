import { CodeParsingOptions, CodeParsingResult } from "./code-parsing-types";

export interface MarkdownImage
{
    url:string;
    description?:string;
}

export interface MarkdownImageParsingItem
{
    text?:string;
    image?:MarkdownImage;
}

export interface MarkdownParsingOptions extends CodeParsingOptions
{
    startLine?:number;
    parseTags?:boolean;
}

export type MarkdownParsingResult=CodeParsingResult<MarkdownLine[]>;

export interface MarkdownTag
{
    name:string;
    value?:string;
}

export interface MarkdownNode
{

    /**
     * For links and images text is the portion of the item in square brackets
     */
    text?:string;

    /**
     * The url of links and angle bracket values.
     * @note May not be a valid URL
     */
    url?:string;

    imageUrl?:string;

    link?:boolean;

    /**
     * If true text is an email address
     */
    email?:boolean;

    bold?:boolean;

    italic?:boolean;

    code?:boolean;
}

export type MarkdownUnorderedListType='-'|'+'|'*';
export type MarkdownLineType='p'|'list-item'|'header'|'code-block'|'hr';
export interface MarkdownLine
{

    type:MarkdownLineType;
    /**
     * Used by headers and block quotes
     */
    headerLevel?:number;
    blockQuoteLevel?:number;
    indent?:number;
    listOrder?:number;
    codeLanguage?:string;

    /**
     * The text content of the line if the line does not use any inline formatting, links or images
     */
    text?:string;

    /**
     * The content of the node if the node does not contain only plain text.
     */
    nodes?:MarkdownNode[];

    ulType?:MarkdownUnorderedListType;

    /**
     * Line number
     */
    ln:number;

    tags?:MarkdownTag[];
}
