import { ConvoTokenUsage } from "@iyio/convo-lang";
import type { Page } from "puppeteer";

export interface ConvoWebCrawlerOptions
{
    id?:string;
    frameWidth?:number;
    frameHeight?:number;
    overlap?:number;
    outDir?:string;
    httpAccessPoint?:string;
    pagePresets?:ConvoPagePreset[];
    disableDefaultCss?:boolean;

    googleSearchApiKey?:string;
    googleSearchCx?:string;
    headed?:boolean;

    /**
     * A usage object that can be used to track all LLM usage of a crawler
     */
    usage?:ConvoTokenUsage;
}

export interface ConvoPagePreset
{
    url?:string;
    match?:RegExp;
    css?:string;
}

export interface ConvoPageCaptureOptions
{
    /**
     * The URL to capture
     */
    url:string;

    /**
     * If true images should be captured
     */
    images?:boolean;

    /**
     * If true a PDF should be captured
     */
    pdf?:boolean;

    /**
     * A set id used to store captured resources
     */
    setId?:string;

    /**
     * CSS to be injected into the captured page.
     */
    css?:string;

    /**
     * A callback that is called after each image capture
     */
    imageCaptureCallback?:ConvoPageImageCaptureCallback;

    /**
     * If true the captureCallback is called after all images are captured.
     */
    captureAllImagesBeforeCallback?:boolean;

}

export type ConvoPageImageCaptureCallback=(image:ConvoCrawlerMedia,page:Page,index:number,buffer:Buffer|null)=>void|ConvoPageImageCaptureCallbackInstruction|Promise<void|ConvoPageImageCaptureCallbackInstruction>;

export type ConvoPageImageCaptureCallbackInstruction=boolean|'retry-safe';

export interface ConvoPageCapture
{
    /**
     * The URL that was captured
     */
    url:string;

    /**
     * Path to captured images
     */
    images?:ConvoCrawlerMedia[];

    /**
     * Path to captured PDF
     */
    pdf?:ConvoCrawlerMedia;

    /**
     * The set id used when capturing
     */
    setId:string;

    /**
     * Clickable or interact-able elements on the page
     */
    actionItems:ConvoPageCaptureActionItem[];
}

export interface ConvoPageCaptureActionItem
{
    id:string;
    type:string;
    x:number;
    y:number;
    w:number;
    h:number;
    elem?:Element;
    text:string;
}

export interface ConvoCrawlerMedia
{
    path:string;
    url:string;
    contentType:string;
}

export interface ConvoPageConversionOptions
{
    /**
     * A set id used to store captured resources
     */
    setId?:string;

    /**
     * An existing page capture. If not defined a new capture will be created.
     * `captureOptions`, `capture` or `url` must be defined or an error will be thrown.
     */
    capture?:ConvoPageCapture;

    /**
     * Options to used to capture page resources. `captureOptions`, `capture` or `url` must be
     * defined or an error will be thrown.
     */
    captureOptions?:ConvoPageCaptureOptions;

    /**
     * URL to capture.`captureOptions`, `capture` or `url` must be defined or an error will
     * be thrown.
     */
    url?:string;
}

export interface ConvoPageConversion
{
    /**
     * The converted URL
     */
    url:string;

    /**
     * The converted page as a markdown document.
     */
    markdown:string;

    /**
     * A summary of the markdown document.
     */
    summary:string;

    /**
     * The page captured used to generate the conversion.
     */
    capture:ConvoPageCapture;

    /**
     * The set id used to store captured resources.
     */
    setId:string;
}

export interface ConvoWebCrawlOptions
{
    url:string;

    /**
     * The max number of links to follow. The page linked to after google search has a depth of 1.
     * @default 2
     */
    maxDepth?:number;

    /**
     * The max number of crawlers per search results. Each crawler will create a new browser
     * instance.
     */
    maxConcurrent?:number;

    /**
     * A description of what the page should look like.
     */
    pageRequirementPrompt?:string;

    /**
     * The max number of results that should be returned
     * @default 3
     */
    resultLimit?:number;
}

export interface ConvoWebCrawl
{
    results:ConvoPageConversion[];
}


export interface ConvoWebSearchOptions
{
    /**
     * The search term to search google for
     */
    term:string;

    /**
     * The max number of search results to scan concurrently.
     * @default 3
     */
    maxConcurrent?:number;

    /**
     * If true sponsored results are ignored
     */
    ignoreSponsored?:boolean;

    /**
     * Page crawling options
     */
    crawlOptions?:Omit<ConvoWebCrawlOptions,'url'>;
}

export interface ConvoWebSearchResult extends ConvoWebCrawl
{
    /**
     * The search term used to search for pages
     */
    term:string;
}
