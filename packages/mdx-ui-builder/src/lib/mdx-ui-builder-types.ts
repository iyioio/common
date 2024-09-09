import { CompileOptions } from "@mdx-js/mdx";

export interface MdxUiCompileOptions
{
    /**
     * Options passed to the @mdx-js/mdx compiler
     */
    mdxJsOptions?:CompileOptions;

    /**
     * Source map options
     */
    sourceMap?:MdxUiSourceMapOptions|true;

    /**
     * Replaces import statements with code.
     */
    importReplacer?:MdxUiImportReplacer;

    /**
     * If true import replacements will be discarded. This can be helpful when creating live
     * components where imported components will be handled at runtime
     */
    discardReplaced?:boolean;

    /**
     * If null the component will not be wrapped with an element
     * @default "div"
     */
    wrapElem?:string|null;
}

export type MdxUiImportReplacer=(packageName:string,importName:string)=>string|null|undefined;

export type MdxUiComponentFn=(props?:Record<string,any>)=>any;

export type MdxUiLiveComponentGenerator=(importReplacement:MdxUiImportReplacement)=>null|any;

/**
 * A reference to an mdx component
 */
export interface MdxUiComponentFnRef{
    Comp:MdxUiComponentFn;
    compileId:number;
}

export interface MdxUiCompileResult
{
    /**
     * The resulting complied code
     */
    code:string;

    /**
     * source map information
     */
    sourceMap?:MdxUiSourceMap;

    /**
     * Replaced imports
     */
    importReplacements:MdxUiImportReplacement[];
}

export interface MdxUiImportReplacement
{
    /**
     * The name of the import that was replaced
     */
    importName:string;

    /**
     * The package the import cam from
     */
    packageName:string;

    /**
     * The content the import was replaced with
     */
    content:string;
}

export interface MdxUiSourceMapOptions
{
    /**
     * The class name prefix of the class that will be added to elements for source map lookup
     * at runtime
     */
    lookupClassNamePrefix?:string;

    /**
     * A prefixed added to all node ids
     */
    idPrefix?:string;

    /**
     * If true child nodes of text editable nodes will be mapped.
     */
    includeTextEditableChildren?:boolean;
}

export interface MdxUiSourceMap
{
    /**
     * The original source code used to compile
     */
    sourceCode:string;

    /**
     * The syntax tree of the compiled code
     */
    tree:MdxUiNode;

    /**
     * Maps ids to syntax tree nodes. Those nodes can be used to get source code positions of the
     * reference element.
     */
    lookup:Record<string,MdxUiNode>;

    /**
     * Additional data for a node
     */
    metadata:Record<string,MdxUiNodeMetadata>;

    /**
     * Ordered list of node ids as they appear in the source code. Parent nodes appear before their
     * children.
     */
    nodesIds:string[];

    /**
     * The class name prefixed used to mark elements at run time
     */
    lookupClassNamePrefix:string;
}

export interface MdxUiSrcPos
{
    line:number;
    column:number;
    offset:number;
}
export interface MdxUiSrcStartEnd
{
    start:MdxUiSrcPos;
    end:MdxUiSrcPos;
}
export interface MdxUiAtt
{
    name:string;
    position?:MdxUiSrcStartEnd;
    type?:string;
    value?:any;
    sourceValue?:any;
}
export interface MdxUiNode
{
    type:string;
    name:string;
    children?:MdxUiNode[];
    position?:MdxUiSrcStartEnd;
    attributes?:MdxUiAtt[];
    data?:Record<string,any>;
    properties?:Record<string,any>;
}

export interface MdxUiCodeInjections
{
    prefix?:string;
    suffix?:string;
}

export interface MdxUiNodeMetadata
{
    /**
     * The node should be allowed to be edited as text
     */
    textEditable?:boolean;
}

/**
 * The status of a MdxUiBuilder
 * - ready - The builder is ready to compiled but has node code to compile
 * - disabled - The builder is currently disabled and will not compile code
 * - waiting - The builder is waiting for any further changes to its code before compiling. The
 *             builder uses the waiting status to debounce code changes and avoid unnecessary compiles.
 *             This behavior can be disabled by setting compileDelayMs to 0.
 * - compiling - The builder is compiling its' code
 * - compiled - The builder has successfully compiled it's code
 * - error - The builder failed to compile it's code
 * - disposed - The builder has been disposed and can no longer compile code
 */
export type MdxUiBuilderStatus='ready'|'disabled'|'waiting'|'compiling'|'complied'|'error'|'disposed';

/**
 * The current state of a MdxUiBuilder
 */
export interface MdxUiBuilderState
{
    /**
     * Current status
     */
    status:MdxUiBuilderStatus;

    /**
     * Id of the compilation that created the state
     */
    compileId:number;

    /**
     * The compilation result of the current state. `compiled` will only be set when the status is
     * `compiled`
     */
    compiled?:MdxUiCompileResult;

    /**
     * A live component reference created from the compile result if live component creation is
     * enabled.
     */
    live?:MdxUiComponentFnRef;

    /**
     * An error resulting from a failed compilation. `error` will only be set when that status is
     * `error`
     */
    error?:MdxUiBuilderError;
}

export interface MdxUiBuilderError
{
    message:string;
    error:any;
    code?:string;
}

export interface MdxUiReactImports
{
    Fragment:any;
    jsx:any;
    jsxs:any;
}

export interface MdxUiSelectionEvt
{
    mouseEvent?:MouseEvent;
    selection:MdxUiSelection|null;
}

/**
 * Represents a selection of source code and rendered ui.
 */
export interface MdxUiSelectionItem
{
    /**
     * The selected DOM element.
     */
    getTarget:()=>Element|undefined;

    /**
     * The selection id will include a lookupClassNamePrefix followed by a unique number. The id
     * will also be one of the targets class names
     */
    id:string;

    node:MdxUiNode;

    metadata?:MdxUiNodeMetadata;

    textEditable:boolean;

    componentType?:string;
}

export interface MdxUiSelection
{
    item:MdxUiSelectionItem;
    all:MdxUiSelectionItem[];
}

export type MdxUiSelectionDirection=number|'forwards'|'backwards';

export interface MdxUiDragDropSource
{
    getSourceCode?:(target:MdxUiSelectionItem)=>string|null|undefined;
    sourceCode?:string;
}
