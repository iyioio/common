import { CancelToken, Lock, delayAsync, httpClient, strCaseInsensitiveCompare, uuid } from '@iyio/common';
import { callConvoFunctionAsync, convoUsageTokensToString, createEmptyConvoTokenUsage, escapeConvoMessageContent, getConvoTextCompletionAsync } from '@iyio/convo-lang';
import { pathExistsAsync } from '@iyio/node-common';
import { format } from 'date-fns';
import { mkdir, writeFile } from 'fs/promises';
import puppeteer from 'puppeteer';
import { defaultConvoWebCrawlOptionsMaxDepth, defaultConvoWebSearchOptionsMaxConcurrent } from './convo-web-crawler-lib';
import { getActionItems, hideFramesFixedAsync, scrollDownAsync, showFramesFixedAsync } from './convo-web-crawler-pup-lib';
import { ConvoCrawlerMedia, ConvoPageCapture, ConvoPageCaptureOptions, ConvoPageConversion, ConvoPageConversionOptions, ConvoPageImageCaptureCallback, ConvoPagePreset, ConvoWebCrawl, ConvoWebCrawlOptions, ConvoWebCrawlerOptions, ConvoWebSearchOptions, ConvoWebSearchResult } from './convo-web-crawler-types';
import { GoogleSearchResult } from './google-search-types';

export class ConvoWebCrawler
{

    public readonly options:Required<ConvoWebCrawlerOptions>;

    public constructor({
        id=format(new Date(),'yyyy-MM-dd-HH-mm')+'-'+uuid(),
        frameHeight=1024,
        frameWidth=1024,
        overlap=100,
        outDir='convo-crawler-out',
        httpAccessPointer='https://convo-crawler-out.ngrok.io',
        pagePresets=[],
        googleSearchApiKey='',
        googleSearchCx='',
        disableDefaultCss=false,
            headed=false,
    }:ConvoWebCrawlerOptions){

        pagePresets=[...pagePresets];

        this.options={
            id,
            frameHeight,
            frameWidth,
            overlap,
            outDir,
            httpAccessPointer,
            pagePresets,
            googleSearchApiKey,
            googleSearchCx,
            disableDefaultCss,
            headed
        }

        if(!disableDefaultCss){
            pagePresets.push({
                css:/*css*/`
                    #onetrust-consent-sdk, .onetrust-consent-sdk{
                        display:none !important;
                    }
                    html,body{
                        min-width:100%;
                        min-height:100%;
                    }
                `
            })
        }

    }

    public getPagePreset(url:string):ConvoPagePreset|undefined{
        const presets=this.options.pagePresets.filter(p=>(
            (!p.url && !p.match) ||
            (p.url && strCaseInsensitiveCompare(p.url,url)) ||
            (p.match && p.match.test(url))
        ));
        if(presets.length===0){
            return undefined;
        }
        if(presets.length===1){
            return presets[0];
        }

        const preset={...presets[0]};
        for(let i=1;i<presets.length;i++){
            const p=presets[i];
            if(!p){continue}
            for(const e in p){
                const v=(p as any)[e];
                if(!v){
                    continue;
                }
                if(e==='css'){
                    if(preset.css){
                        preset.css+='\n'+v;
                    }else{
                        preset.css=v;
                    }
                }else{
                    (preset as any)[e]=v;
                }
            }
        }

        return preset;

    }

    private async getOutDirAsync():Promise<string>
    {
        const path=`${this.options.outDir}/${this.options.id}`;
        if(!await pathExistsAsync(path)){
            await mkdir(path,{recursive:true});
        }
        return path;
    }

    public async searchAsync({
        term,
        maxConcurrent=defaultConvoWebSearchOptionsMaxConcurrent,
        crawlOptions,
        usage=crawlOptions?.usage??createEmptyConvoTokenUsage(),
    }:ConvoWebSearchOptions,cancel?:CancelToken):Promise<ConvoWebSearchResult>{

        const searchResult=await httpClient().getAsync<GoogleSearchResult>(
            `https://www.googleapis.com/customsearch/v1?key=${
                encodeURIComponent(this.options.googleSearchApiKey)
            }&cx=${
                encodeURIComponent(this.options.googleSearchCx)
            }&q=${
                encodeURIComponent(term)
            }`
        );

        cancel?.throwIfCanceled();

        if(!searchResult?.items){
            throw new Error('No search results returned');
        }

        const lock=new Lock(maxConcurrent);

        const result:ConvoWebSearchResult={
            term,
            results:[],
            usage,
        }

        await Promise.all(searchResult.items.map(async link=>{
            if(!link.link){
                return;
            }
            const release=await lock.waitOrCancelAsync(cancel);
            if(!release){
                return;
            }

            try{
                await this._crawPageAsync({
                    ...crawlOptions,
                    url:link.link,
                    usage
                },result,1,cancel);
            }finally{
                release();
            }
        }))

        return result;
    }

    public async crawPageAsync(options:ConvoWebCrawlOptions,cancel?:CancelToken):Promise<ConvoWebCrawl>{
        const crawl:ConvoWebCrawl={
            results:[],
            usage:options.usage??createEmptyConvoTokenUsage()
        }
        await this._crawPageAsync(options,crawl,1,cancel);
        return crawl;
    }

    private async _crawPageAsync(
        options:ConvoWebCrawlOptions,
        crawl:ConvoWebCrawl,
        depth:number,
        cancel?:CancelToken
    ):Promise<void>{

        const {
            url,
            pageRequirementPrompt,
            usage=createEmptyConvoTokenUsage(),
            maxDepth=defaultConvoWebCrawlOptionsMaxDepth
        }=options;

        if(depth>maxDepth){
            return;
        }

        const capture=await this.capturePageAsync({
            url,
            pdf:true,
            images:true,
        },cancel);

        cancel?.throwIfCanceled();
        const first=capture.images?.[0];
        if(!first){
            return;
        }

        const typeParams=await callConvoFunctionAsync({usage,append:/*convo*/`
            > define
            __model='gpt-4o'
            __trackTokenUsage=true
            secondImage=${JSON.stringify(capture.images?.[1]?.url)}

            > classifyWebsite(
                type:enum("landing-page" "main-content" "reference-list" "other")
            )

            > user
            Classify the following images of a website based on their main purpose by calling the classifyWebsite function.
            Pages that primarily link to other pages should be considered a reference-list.

            > user
            ![](${first.url})

            @condition secondImage
            > user
            ![]({{secondImage}})

        `});

        let scanLinks=true;

        if(typeParams?.type==='main-content'){

            let convert=true;


            if(pageRequirementPrompt){
                const r=await callConvoFunctionAsync({usage,append:/*convo*/`
                    > define
                    __model='gpt-4o'
                    __trackTokenUsage=true

                    secondImage=${JSON.stringify(capture.images?.[1]?.url)}

                    > setRequirementsMet(
                        # True if the given requirements where met
                        requirementsMet:boolean
                    )

                    > user
                    Call setRequirementsMet based on the following requirements and the following image of screenshot of the top of a webpage.

                    Requirements:
                    ${escapeConvoMessageContent(pageRequirementPrompt)}

                    > user
                    ![](${first.url})

                    @condition secondImage
                    > user
                    ![]({{secondImage}})

                `})

                convert=r?.requirementsMet?true:false;
            }

            if(convert){
                const conversation=await this.convertPageAsync({
                    capture,
                    usage
                });

                crawl.results.push(conversation);
                scanLinks=false;
            }else{
                scanLinks=true;
            }
        }

        if(scanLinks){
            //scan
        }

    }

    public async convertPageAsync({
        captureOptions,
        url,
        usage=createEmptyConvoTokenUsage(),
    }:ConvoPageConversionOptions,cancel?:CancelToken):Promise<ConvoPageConversion>{

        console.info(`id ${this.options.id}`)

        const md:string[]=[];

        const outDir=await this.getOutDirAsync();

        if(!captureOptions){
            if(!url){
                throw new Error('captureOptions or url must be supplied');
            }
            captureOptions={url,images:true,pdf:true}
            if(!captureOptions.setId){
                captureOptions.setId=uuid();
            }
        }

        const callback:ConvoPageImageCaptureCallback=async (img,page,i)=>{

            console.info(`converting page ${i}`);

            const value=await getConvoTextCompletionAsync({usage,append:/*convo*/`
                > define
                __model='gpt-4o'
                __trackTokenUsage=true

                isFirst=${i?'false':'true'}

                > system
                You are a web scraping agent that is converting a series of screenshots of a web page into markdown.
                Convert tables, graphs and charts into markdown tables with a detailed description.
                If a graph or chart can not be converted into a markdown table convert it to [Mermaid](https://mermaid.js.org/) diagram in a code block.
                Convert images into markdown images with a detailed description in the alt text area and if you don't know the full URL to the image use an empty anchor link (a single hash tag).
                Do not enclose your responses in a markdown code block.
                Ignore any site navigation UI elements.
                Ignore any ads.
                If a blank image is given respond with the text "BLANK" in all caps.

                @condition isFirst
                > user
                Convert the following image into a detailed markdown document.

                @condition !isFirst
                > user
                Convert the following image into a detailed markdown document.
                The following image continues where the following markdown ends.
                The image and markdown overlap.
                Your response should start exactly where the overlap ends.

                Markdown from previous screenshot:
                ${escapeConvoMessageContent(md[i-1]||'Empty')}

                > user
                ![](${img.url})
            `});

            cancel?.throwIfCanceled();

            if(value==='BLANK'){
                return 'retry-safe'
            }

            md.push(value??'');

            await writeFile(`${outDir}/${captureOptions?.setId}-img-${i}.md`,value??'');

            console.info(`page ${i} converted. Total token usage: ${convoUsageTokensToString(usage)} `);

            return true;

        }
        const capture=await this.capturePageAsync({...captureOptions,imageCaptureCallback:callback},cancel);
        const {setId}=capture;

        const markdown=md.join('\n\n');

        const summary=await getConvoTextCompletionAsync({usage,append:/*convo*/`
            > define
            __model='gpt-4o'
            __trackTokenUsage=true

            > user
            Summarize the following markdown document.
            Include important financial numbers that would be important to a financial advisor.
            Format the summary using markdown. Do not enclose your responses in a markdown code block.

            ${escapeConvoMessageContent(markdown)}

        `});

        cancel?.throwIfCanceled();



        await writeFile(`${outDir}/${setId}-document.md`,markdown);
        await writeFile(`${outDir}/${setId}-summary.md`,summary??'');

        const conversion:ConvoPageConversion={
            url:capture.url,
            markdown,
            usage,
            summary:summary??'',
            capture,
            setId
        }

        await writeFile(`${outDir}/${setId}-conversion.json`,JSON.stringify(conversion,null,4));

        return conversion;

    }

    /**
     * Captures media and content resources of a page that can be used to generate conversions and
     * summaries
     */
    public async capturePageAsync({
        url,
        pdf:includePdf,
        images:includeImages,
        setId=uuid(),
        css,
        captureAllImagesBeforeCallback,
        imageCaptureCallback
    }:ConvoPageCaptureOptions,cancel?:CancelToken):Promise<ConvoPageCapture>{

        const {
            frameHeight,
            frameWidth,
            overlap
        }=this.options;


        let images:ConvoCrawlerMedia[]|undefined;
        let pdf:ConvoCrawlerMedia|undefined;

        const outDir=await this.getOutDirAsync();

        const browser=await puppeteer.launch({
            headless:!this.options.headed,
             args:[
                `--window-size=${frameWidth},${frameHeight+74}`
            ]
        });
        try{

            const page=await browser.newPage();

            await page.setViewport({width:frameWidth,height:frameHeight});

            let navigated=false;
            for(let t=0;t<3;t++){
                try{
                    await page.goto(url,{timeout:30000,waitUntil:['load','domcontentloaded']});
                }catch(ex){
                    console.error('Navigation error',ex);
                }
                navigated=true;
            }
            if(!navigated){
                throw new Error(`Failed to navigate to ${url} after max attempts`);
            }

            cancel?.throwIfCanceled();

            await delayAsync(3000);

            const preset=this.getPagePreset(url);
            if(css || preset?.css){
                await page.evaluate((css)=>{
                    document.head.insertAdjacentHTML('beforeend',`<style>${css}</style>`);
                },`${preset?.css??''}\n${css??''}`)
                await delayAsync(100);
            }

            if(includePdf){
                const pdfBuffer=await page.pdf({
                    timeout:2*60000
                });
                const name=`${setId}-pdf.pdf`
                pdf={
                    path:`${this.options.id}/${name}`,
                    url:`${this.options.httpAccessPointer}/${this.options.id}/${name}`,
                    contentType:'application/pdf'
                }
                await writeFile(`${outDir}/${name}`,pdfBuffer);
                cancel?.throwIfCanceled();
            }

            if(includeImages){

                images=[];
                let i=0;
                let safeMode=false;
                while(true){

                    if(i && !safeMode){
                        await hideFramesFixedAsync(page.frames());
                    }
                    await delayAsync(safeMode?2000:1000);
                    const img=await page.screenshot();
                    if(i && !safeMode){
                        await showFramesFixedAsync(page.frames());
                    }
                    cancel?.throwIfCanceled();

                    const name=`${setId}-img-${i}.png`

                    const imageMedia:ConvoCrawlerMedia={
                        path:`${this.options.id}/${name}`,
                        url:`${this.options.httpAccessPointer}/${this.options.id}/${name}`,
                        contentType:'image/png'
                    }

                    images.push(imageMedia)
                    await writeFile(`${outDir}/${name}`,img);
                    cancel?.throwIfCanceled();

                    if(!captureAllImagesBeforeCallback && imageCaptureCallback){
                        const instruction=await imageCaptureCallback(imageMedia,page,i,img);
                        cancel?.throwIfCanceled();
                        if(instruction===false){
                            break;
                        }else if(instruction==='retry-safe'){
                            safeMode=true;
                            continue;
                        }
                    }

                    i++;

                    if(!await scrollDownAsync(page,frameHeight-overlap)){
                        break;
                    }
                }
            }

            cancel?.throwIfCanceled();

            await page.evaluate(()=>{
                const target=document.querySelector('html')??document.body;
                target.style.transform='';
            });

            const actionItems=await getActionItems(page);

            if(captureAllImagesBeforeCallback && imageCaptureCallback && images){
                for(let i=0;i<images.length;i++){
                    const imageMedia=images[i];
                    if(!imageMedia){continue}
                    const _continue=await imageCaptureCallback(imageMedia,page,i,null);
                    cancel?.throwIfCanceled();
                    if(_continue===false){
                        break;
                    }
                }
            }

            return {
                url,
                images,
                pdf,
                setId,
                actionItems,
            };

        }finally{

            await browser.close();

        }
    }
}
