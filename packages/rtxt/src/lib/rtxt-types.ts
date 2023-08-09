import type { RTxtEditor } from "./RTxtEditor";
import type { RTxtRenderer } from "./RTxtRenderer";

export const defaultRTxtNodeType='span';

export const defaultRTxtLineElem='p';

export type RTxtRenderMode='class'|'inline';
export const defaultRTxtRenderMode:RTxtRenderMode='class';

export const rTxtIndexLookupAtt='data-rtxt-index';

export const rTxtLineIndexAtt='data-rtxt-line';

export const rTxtLineAlignAtt='data-rtxt-line-align';

export const rTxtTypeAtt='data-rtxt-type';

export const rTxtAttPrefix='data-rtxt-att-';

export const rTxtNodeAtt='data-rtxt-node';

export const rTxtDocAtt='rtxt-doc';

export const rTxtIgnoreAtt='rtxt-ignore';

export const defaultRTxtClassNamePrefix='rtxt-';

export const defaultRTxtDocClassName='rtxt-doc';

export type RTxtAlignment='start'|'center'|'end';
export const defaultRTxtAlignment:RTxtAlignment='start';

export const defaultRTxtChangeDelayMs=600;

export interface RTxtDoc
{
    lines:(RTxtLine|RTxtNode[])[];
}

export interface RTxtLine
{
    nodes:RTxtNode[];

    align?:RTxtAlignment;

    atts?:Record<string,string>;
}

export interface RTxtNode
{
    /**
     * The node's type or types
     * @default 'span'
     */
    t?:string|string[];

    /**
     * The text value of the node
     */
    v?:string;

    /**
     * Attributes of the node
     */
    atts?:Record<string,string>;
}

export interface RTxtDocAndLookup
{
    doc:RTxtDoc;
    lookup:RTxtNode[];
}

export interface RTxtEditorOptions
{
    /**
     * Css selector, viewer or HTML element to bind the editor to.
     */
    renderer?:RTxtRenderer|RTxtRenderOptions;

    /**
     * If true the default editor style sheet will not be inserted.
     */
    useCustomStyleSheet?:boolean;

    style?:RTxtEditorStyle;

    /**
     * Tools that will populate the tool menu. If undefined the tools returned from
     * getDefaultRTxtTools will be used.
     */
    tools?:RTxtTool[];

    /**
     * A prefix that will be added to all rendered editor classNames
     */
    classPrefix?:string;
}

export interface RTxtRenderOptions
{
    /**
     * Css selector or HTML element to bind the viewer to.
     */
    target?:string|HTMLElement;

    /**
     * Document to render
     */
    doc?:RTxtDoc;

    /**
     * Controls how nodes are rendered.
     * @default = 'class'
     */
    renderMode?:RTxtRenderMode;

    /**
     * A prefix that will be added to all rendered classNames
     */
    classPrefix?:string;

    /**
     * A class name that is added to the root document element
     * @default 'rtxt-doc'
     */
    docClassName?:string|null;

    descriptors?:RTxtDescriptor[];

    /**
     * Defines the type of element that each line is wrapped in.
     * @default = 'p'
     */
    lineElem?:string;

    /**
     * If true line break "br" elements are added between lines
     */
    lineBreaks?:boolean;

    /**
     * If true the default viewer style sheet will not be inserted.
     */
    useCustomStyleSheet?:boolean;

    fontFamilies?:RTxtFontFamily[];

    /**
     * If true not style sheet will be generated to support the supplied fontFamilies.
     */
    disableFontFamilyCss?:boolean;

    placeholder?:string;

    /**
     * Number of milliseconds the delayed change event is delayed by.
     */
    changeDelayMs?:number;
}

export interface RTxtDescriptor
{

    /**
     * Used to match the descriptors to nodes using the node's t property.
     */
    type:string;

    elem:string;

    /**
     * If true and the node's element type is used self closing html tags are disabled.
     */
    noSelfClose?:boolean;

    /**
     * Class name or class names used when the render mode is set to 'class'. The default className
     * of the node is the viewers class name prefix followed by the nodes type
     */
    className?:string|string[]|((node:RTxtNode)=>string|string[]|undefined);

    /**
     * The inline style used when the render mode is set to 'inline'.
     */
    inlineStyle?:RTxtStyleProvider;

    /**
     * Inline style used regardless of render mode.
     */
    style?:RTxtStyleProvider;

    remove?:(node:RTxtNode)=>void;

    priority?:number;

    /**
     * A node can only have 1 type for a given group.
     */
    group?:string;
}

export type RTxtStyleProvider=Record<string,string|null|undefined>|((node:RTxtNode)=>Record<string,string|null|undefined>);

export interface RTxtSelection
{
    nodes:RTxtNode[];
    startNode:RTxtNode;
    startIndex:number;
    startOffset:number;
    endNode:RTxtNode;
    endIndex:number;
    endOffset:number;
    cursorIndex:number;
    cursorNode?:RTxtNode;
}

export interface RTxtDomSelection
{
    anchorNode:Node|null;
    anchorOffset:number;
    focusNode:Node|null;
    focusOffset:number;
}

export interface RTxtEditorStyle
{
    backgroundColor?:string;
    borderColor?:string;
    zIndex?:number;
    selectedColor?:string;
    foregroundColor?:string;
}

export interface RTxtTool
{
    /**
     * descriptor types that the tool is used with
     */
    types:string[];

    render(editor:RTxtEditor):Element|null|Element[];

    /**
     * Called when the current selection changes
     * @param selection The current doc selection
     * @param selectedDescriptors Array of descriptors that match the types of the tool which describe
     *                 any currently selected characters
     */
    onSelectionChange?:(toolSelection:RTxtToolSelection)=>void;

    isSelected?:(toolSelection:RTxtToolSelection)=>boolean;
}

export interface RTxtToolSelection
{
    editor:RTxtEditor;
    selection:RTxtSelection|null;
    nodes:RTxtNode[];
    lines:RTxtLine[];
    descriptors:RTxtDescriptor[];
    toolElems:Element[];
    toolElem?:Element;
    styleAtCursor?:CSSStyleDeclaration;
    elemAtCursor?:Element;
    colorAtCursor?:string;
    sizeAtCursor?:string;
    nodeAtCursor?:RTxtNode;
}

export interface RTxtFontFamily
{
    label:string;
    family?:string;
    className?:string;
}
