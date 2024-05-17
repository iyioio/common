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
    parseMarkup?:boolean;
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

    /**
     * Link title or other title
     */
    title?:string;

    imageUrl?:string;
    /**
     * Image title
     */
    imageTitle?:string;

    link?:boolean;

    /**
     * If true text is an email address
     */
    email?:boolean;

    bold?:boolean;

    italic?:boolean;

    code?:boolean;

    markup?:MarkdownMarkupTag;

}

/**
 * Represents an opening or closing markup tag in a block of markdown. Markup tags in markdown
 * are not hierarchal.
 */
export interface MarkdownMarkupTag
{
    tag:string;
    attributes?:Record<string,string>;
    /**
     * True if the markup tag is a opening tag. If a tag is a self closing tag open and close
     * will be true.
     */
    open?:boolean;
    /**
     * True if the markup tag is a closing tag. If a tag is a self closing tag open and close
     * will be true.
     */
    close?:boolean;
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

    /**
     * End line number. Only used with the line spans multiple lines.
     */
    eln?:number;

    tags?:MarkdownTag[];
}


export type MarkdownOutputFormat='plain'|'markdown'|'html';

export interface MarkdownOutputOptions
{
    format:MarkdownOutputFormat;

    getNodeHtmlAtts?:(line:MarkdownLine,node:MarkdownNode,prop:keyof MarkdownNode)=>Record<string,string>|null|undefined;
    getLineHtmlAtts?:(line:MarkdownLine,prop:(keyof MarkdownLine)|'p'|'hr'|'code')=>Record<string,string|null|undefined>|null|undefined;
}
