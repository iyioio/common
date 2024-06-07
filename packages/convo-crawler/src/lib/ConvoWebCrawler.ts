import { CancelToken, Lock, delayAsync, escapeHtml, httpClient, strCaseInsensitiveCompare, uuid } from '@iyio/common';
import { ConvoTokenUsage, callConvoFunctionAsync, convoUsageTokensToString, createEmptyConvoTokenUsage, escapeConvoMessageContent, getConvoTextCompletionAsync, resetConvoUsageTokens } from '@iyio/convo-lang';
import { pathExistsAsync } from '@iyio/node-common';
import { format } from 'date-fns';
import { mkdir, writeFile } from 'fs/promises';
import puppeteer, { Browser } from 'puppeteer';
import { convoWebActionItemToMdLink, defaultConvoWebCrawlOptionsMaxConcurrent, defaultConvoWebCrawlOptionsMaxDepth, defaultConvoWebCrawlOptionsResultLimit, defaultConvoWebSearchOptionsMaxConcurrent } from './convo-web-crawler-lib';
import { getFramesActionItems, hideFramesFixedAsync, scrollDownAsync, showFramesFixedAsync } from './convo-web-crawler-pup-lib';
import { ConvoCrawlerMedia, ConvoPageCapture, ConvoPageCaptureOptions, ConvoPageConversion, ConvoPageConversionData, ConvoPageConversionOptions, ConvoPagePreset, ConvoWebCrawl, ConvoWebCrawlOptions, ConvoWebCrawlerOptions, ConvoWebResearchOptions, ConvoWebResearchResult, ConvoWebSearchOptions, ConvoWebSearchResult, ConvoWebSubjectSummary } from './convo-web-crawler-types';
import { GoogleSearchResult } from './google-search-types';

export class ConvoWebCrawler
{

    public readonly options:Required<ConvoWebCrawlerOptions>;

    public readonly usage:ConvoTokenUsage;

    public constructor({
        id=format(new Date(),'yyyy-MM-dd-HH-mm')+'-'+uuid(),
        frameHeight=1024,
        frameWidth=1024,
        overlap=100,
        outDir='convo-crawler-out',
        httpAccessPoint: httpAccessPointer='https://convo-crawler-out.ngrok.io',
        pagePresets=[],
        googleSearchApiKey='',
        googleSearchCx='',
        disableDefaultCss=false,
        headed=false,
        usage=createEmptyConvoTokenUsage(),
        debug=false,
    }:ConvoWebCrawlerOptions){

        pagePresets=[...pagePresets];

        this.options={
            id,
            frameHeight,
            frameWidth,
            overlap,
            outDir,
            httpAccessPoint: httpAccessPointer,
            pagePresets,
            googleSearchApiKey,
            googleSearchCx,
            disableDefaultCss,
            headed,
            usage,
            debug,
        }

        this.usage={...usage};

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

    public resetUsage()
    {
        resetConvoUsageTokens(this.usage);
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



    private async completeTextAsync(convo:string):Promise<string>
    {
        const value=await getConvoTextCompletionAsync({usage:this.usage,debug:this.options.debug,append:`
            > define
            __model='gpt-4o'
            __trackTokenUsage=true

            ${convo}
        `});

        return value??'';
    }

    private async callFunctionAsync<T>(convo:string):Promise<T|undefined>
    {
        const value=await callConvoFunctionAsync({usage:this.usage,debug:this.options.debug,append:`
            > define
            __model='gpt-4o'
            __trackTokenUsage=true

            ${convo}
        `});

        return value??undefined;
    }

    private async getOutDirAsync():Promise<string>
    {
        const path=`${this.options.outDir}/${this.options.id}`;
        if(!await pathExistsAsync(path)){
            await mkdir(path,{recursive:true});
        }
        return path;
    }

    public async runResearchAsync({
        title,
        subjects,
        conclusion,
        searchOptions,
        searchResults,
    }:ConvoWebResearchOptions,cancel?:CancelToken):Promise<ConvoWebResearchResult>{

        if(!searchResults){
            if(!searchOptions){
                throw new Error('searchOptions or searchResults required')
            }
            searchResults=await this.searchAsync(searchOptions,cancel);
        }

        cancel?.throwIfCanceled();

        const resultsMd=searchResults.results.map(r=>`URL: ${r.url}\n\n${r.summary}`).join('\n\n\n\n');

        console.info('Generating subject summaries');

        const subjectSummaries=await Promise.all(subjects.map<Promise<ConvoWebSubjectSummary>>(async subject=>{

            const summary=await this.completeTextAsync(/*convo*/`

                > define
                multipleSubjects=${subjects.length>1}

                > system
                You are a research agent analyzing the summarization of a collection of articles.
                Summarize the collection of articles based on the following subject.

                Subject: ${escapeConvoMessageContent(subject)}

                @concat
                @condition multipleSubjects
                > system
                Keep in mind that multiple subject summaries will be generated based on the same article collection.
                For now focus on the subject of "${escapeConvoMessageContent(subject)}" but if there are any important relations between the subject you can include them.

                Other Subjects: ${escapeConvoMessageContent(subjects.filter(sub=>sub!==subject).join(', '))}

                @concat
                > system
                After generating all subject summaries a finally conclusion will be generated based on "${escapeConvoMessageContent(conclusion)}".
                Primarily focus on the subject of "${escapeConvoMessageContent(subject)}".

                Do not include a title or header as part of the summary.


                > user
                Articles:

                ${escapeConvoMessageContent(resultsMd)}

            `)

            return {
                subject,
                summary:summary??'',
            }
        }));

        console.info('Generating conclusion');

        const conclusionSummary=await this.completeTextAsync(/*convo*/`

            > define
            multipleSubjects=${subjects.length>1}

            > system
            You are a research agent writing your final conclusion about "${escapeConvoMessageContent(conclusion)}" based on a collection of articles and subject specific summaries.

            Do not include a title or header as part of the conclusion.


            > user
            Articles:

            ${escapeConvoMessageContent(resultsMd)}

            > user
            Subject Summaries:

            ${subjectSummaries.map(s=>`Subject: ${escapeConvoMessageContent(s.subject)}\nSummary:\n${escapeConvoMessageContent(s.summary)}`).join('\n\n\n')}

        `)


        const result:ConvoWebResearchResult={
            title,
            subjects,
            conclusion,
            subjectSummaries,
            conclusionSummary:conclusionSummary??'',
            usage:this.usage,
        }

        const outDir=await this.getOutDirAsync();

        await writeFile(`${outDir}/research-${Date.now()}.json`,JSON.stringify(result,null,4));
        await writeFile(`${outDir}/research-${Date.now()}.md`,`# ${
            escapeHtml(title)
        }\n*date - ${
            format(new Date(),'PPpp')
        }*\n\n${
            subjectSummaries.map(s=>`- [${escapeHtml(s.subject)}](#${escapeHtml(s.subject.replace(/\s/g,'-'))})`).join('\n')
        }\n- [Conclusion](#Conclusion)\n\n\n${
            subjectSummaries.map(s=>`## ${escapeHtml(s.subject)}\n${escapeHtml(s.summary)}`).join('\n\n\n')
        }\n\n\n## Conclusion\n${escapeHtml(conclusionSummary??'')}`);

        return result;

    }

    public async searchAsync({
        term,
        maxConcurrent=defaultConvoWebSearchOptionsMaxConcurrent,
        crawlOptions,
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
            crawled:[],
            usage:this.usage,
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
                await this._crawPageAsync(
                    {...crawlOptions,url:link.link},
                    result,
                    1,
                    new Lock(crawlOptions?.maxConcurrent??defaultConvoWebCrawlOptionsMaxConcurrent),
                    cancel
                );
            }finally{
                release();
            }
        }));

        const outDir=await this.getOutDirAsync();

        await writeFile(`${outDir}/search-${Date.now()}.json`,JSON.stringify(result,null,4));

        return result;
    }

    public async crawPageAsync(options:ConvoWebCrawlOptions,cancel?:CancelToken):Promise<ConvoWebCrawl>{
        const crawl:ConvoWebCrawl={
            crawled:[],
            results:[],
        }
        await this._crawPageAsync(
            options,
            crawl,
            1,
            new Lock(options.maxConcurrent??defaultConvoWebCrawlOptionsMaxConcurrent),
            cancel
        );
        return crawl;
    }

    private async _crawPageAsync(
        options:ConvoWebCrawlOptions,
        crawl:ConvoWebCrawl,
        depth:number,
        concurrentLock:Lock,
        cancel?:CancelToken
    ):Promise<void>{

        const {
            url,
            pageRequirementPrompt,
            maxDepth=defaultConvoWebCrawlOptionsMaxDepth,
            resultLimit=defaultConvoWebCrawlOptionsResultLimit,
        }=options;

        if(depth>maxDepth || crawl.crawled.includes(url.toLowerCase())){
            return;
        }

        crawl.crawled.push(url.toLowerCase());

        let isMainContent:boolean|'checking'|null=null;

        const checkForMainContent=async (images:ConvoCrawlerMedia[])=>{
            if(images.length===0){
                isMainContent=false;
                return false;
            }
            isMainContent='checking';
            const [typeParams,reqParams]=await Promise.all([
                this.callFunctionAsync<{type:string}>(/*convo*/`

                    > define
                    secondImage=${JSON.stringify(images[1]?.url)}

                    > classifyWebsite(
                        type:enum("landing-page" "main-content" "reference-list" "other")
                    )

                    > user
                    Classify the following images of a website based on their main purpose by calling the classifyWebsite function.
                    Pages that primarily link to other pages should be considered a reference-list.

                    > user
                    ![](${images[0]?.url})

                    @condition secondImage
                    > user
                    ![]({{secondImage}})

                `),
                !pageRequirementPrompt?null:this.callFunctionAsync<{requirementsMet:boolean}>(/*convo*/`
                    > define
                    secondImage=${JSON.stringify(images[1]?.url)}

                    > setRequirementsMet(
                        # True if the given requirements where met
                        requirementsMet:boolean
                    )

                    > user
                    Call setRequirementsMet based on the following requirements and the following image of screenshot of the top of a webpage.

                    Requirements:
                    ${escapeConvoMessageContent(pageRequirementPrompt)}

                    > user
                    ![](${images[0]?.url})

                    @condition secondImage
                    > user
                    ![]({{secondImage}})

                `)
            ]);

            isMainContent=(
                typeParams?.type==='main-content' &&
                (pageRequirementPrompt?reqParams?.requirementsMet===true:true)
            );
            return isMainContent;
        }

        const release=await concurrentLock.waitOrCancelAsync(cancel);
        if(!release){
            return;
        }
        let linkUrls:string[]|undefined;
        try{
            const browser=await this.createBrowserAsync();

            try{
                const page=await browser.newPage();
                const conversion=await this.convertPageAsync({
                    captureOptions:{
                        url,
                        browser,
                        page,
                    },
                    whileSummarizingCallback:async (data,img,page,index)=>{
                        if(crawl.results.length>=resultLimit){
                            return false;
                        }
                        if(index!==1){
                            return true;
                        }
                        return await checkForMainContent(data.images);
                    }
                },cancel);

                if(crawl.results.length>=resultLimit){
                    return;
                }

                if(isMainContent===null){// will be null if only one page was scanned
                    await checkForMainContent(conversion.capture.images??[]);
                }

                if(crawl.results.length>=resultLimit){
                    return;
                }

                if(isMainContent){
                    crawl.results.push(conversion);
                }else{
                    const links=(await getFramesActionItems(page.frames(),false)).filter(a=>a.href);
                    const images=conversion.capture.images;
                    const nav=await this.callFunctionAsync<{urls:string[]}>(/*convo*/`
                        > define
                        secondImage=${JSON.stringify(images[1]?.url)}
                        hasReq=${pageRequirementPrompt?'true':'false'}
                        hasCrawlLinks=${crawl.crawled.length?'true':'false'}

                        > navigateTo(
                            # URL of new page to navigate to
                            urls:array(string)
                        )

                        > user
                        Based on the following links and images select the top 5 URLs to navigate to by calling navigateTo. Do not use anchor links.

                        Links:
                        ${links.map(convoWebActionItemToMdLink).join('\n')}

                        @concat
                        @condition hasCrawlLinks
                        Do not include any of the following URLs, they have already be scanned.
                        ${crawl.crawled.map(u=>escapeConvoMessageContent(u)).join('\n')}

                        @concat
                        @condition hasReq
                        > user
                        The URLs passed to navigateTo should point to pages that meet the follow requirements based on your best knowledge:
                        ${escapeConvoMessageContent(pageRequirementPrompt??'')}

                        > user
                        ![](${images[0]?.url})

                        @condition secondImage
                        > user
                        ![]({{secondImage}})

                    `)

                    if(nav?.urls.length){
                        linkUrls=nav.urls as string[];
                        linkUrls=linkUrls.filter(u=>!crawl.crawled.includes(u.toLowerCase()))
                    }

                }
            }finally{
                browser.close();
            }
        }finally{
            release();
        }

        if(linkUrls?.length){
            await Promise.all(linkUrls.map((u)=>{
                return this._crawPageAsync(
                    {...options,url:u},
                    crawl,
                    depth+1,
                    concurrentLock,
                    cancel,
                )
            }));
        }

    }

    public async convertPageAsync({
        captureOptions,
        url,
        beforeSummarizeCallback,
        afterSummarizeCallback,
        whileSummarizingCallback
    }:ConvoPageConversionOptions,cancel?:CancelToken):Promise<ConvoPageConversion>{

        console.info(`id ${this.options.id}`)

        const summaries:string[]=[];
        const images:ConvoCrawlerMedia[]=[];
        const data:ConvoPageConversionData={summaries,images};

        const outDir=await this.getOutDirAsync();

        if(!captureOptions){
            if(!url){
                throw new Error('captureOptions or url must be supplied');
            }
            captureOptions={url}
        }
        if(!captureOptions.setId){
            captureOptions.setId=uuid();
        }

        const capture=await this.capturePageAsync({...captureOptions,imageCaptureCallback:async (img,page,index,buffer)=>{

            images.push(img);

            console.info(`converting page ${index}`);

            const beforeResult=await beforeSummarizeCallback?.(data,img,page,index,buffer);
            if(beforeResult===false){
                return false;
            }

            const whilePromise=whileSummarizingCallback?.(data,img,page,index,buffer);

            const links=img.actionItems?.filter(a=>a.href)??[];

            const value=await this.completeTextAsync(/*convo*/`
                > define
                isFirst=${index?'false':'true'}
                hasLinks=${links.length?'true':'false'}

                > system
                You are a web scraping agent that is converting a series of screenshots of a web page into markdown.
                Convert tables, graphs and charts into markdown tables with a detailed description.
                If a graph or chart can not be converted into a markdown table convert it to [Mermaid](https://mermaid.js.org/) diagram in a code block.
                Convert images into markdown images with a detailed description in the alt text area and if you don't know the full URL to the image use an empty anchor link (a single hash tag).
                Do not enclose your responses in a markdown code block.
                Ignore any site navigation UI elements.
                Ignore any ads.
                If a blank image is given respond with the text "BLANK" in all caps.

                > user
                Convert the following image into a detailed markdown document.

                @concat
                @condition hasLinks
                > user
                Below is a list of hyperlinks on the page. Each item in the list includes text as the link is display in the following image and its URL.
                When converting the following image into markdown you can use the list of links to populate the generated markdown links.
                If you are unsure of which URL to use when converting a link use an empty anchor link (a single hashtag) as the URL.

                Page Hyperlinks:
                ${links.map(convoWebActionItemToMdLink).join('\n')}

                @condition !isFirst
                @concat
                > user
                The following image continues where the following markdown ends.
                The image and markdown overlap.
                Your response should start exactly where the overlap ends.

                Markdown from previous screenshot:
                ${escapeConvoMessageContent(summaries[index-1]||'Empty')}

                > user
                ![](${img.url})
            `);

            cancel?.throwIfCanceled();

            const whileResult=await whilePromise;
            if(whileResult===false){
                return false;
            }

            summaries.push(value);

            const afterResult=await afterSummarizeCallback?.(data,img,page,index,buffer);
            if(afterResult===false){
                return false;
            }

            if(value==='BLANK'){
                return 'retry-safe'
            }

            await writeFile(`${outDir}/${captureOptions?.setId}-img-${index}.md`,value);

            console.info(`page ${index} converted. Total token usage: ${convoUsageTokensToString(this.usage)} `);

            return true;

        }},cancel);
        const {setId}=capture;

        const markdown=summaries.join('\n\n');

        console.info('Generating summary');

        const summary=await this.completeTextAsync(/*convo*/`

            > user
            Summarize the following markdown document.
            Include important financial numbers that would be important to a financial advisor.
            Format the summary using markdown. Do not enclose your responses in a markdown code block.

            ${escapeConvoMessageContent(markdown)}

        `);

        cancel?.throwIfCanceled();



        await writeFile(`${outDir}/${setId}-document.md`,markdown);
        await writeFile(`${outDir}/${setId}-summary.md`,summary);

        const conversion:ConvoPageConversion={
            url:capture.url,
            markdown,
            summary:summary,
            capture,
            setId
        }

        await writeFile(`${outDir}/${setId}-conversion.json`,JSON.stringify(conversion,null,4));

        console.info(`Page conversion token usage: ${convoUsageTokensToString(this.usage)}`)

        return conversion;

    }

    private async createBrowserAsync():Promise<Browser>{
        const browser=await puppeteer.launch({
            headless:!this.options.headed,
             args:[
                `--window-size=${this.options.frameWidth},${this.options.frameHeight+74}`
            ]
        });
        return browser;
    }

    /**
     * Captures media and content resources of a page that can be used to generate conversions and
     * summaries
     */
    public async capturePageAsync({
        url,
        setId=uuid(),
        css,
        captureAllImagesBeforeCallback,
        imageCaptureCallback,
        browser,
        page
    }:ConvoPageCaptureOptions,cancel?:CancelToken):Promise<ConvoPageCapture>{

        const {
            frameHeight,
            frameWidth,
            overlap
        }=this.options;


        let images:ConvoCrawlerMedia[]|undefined;
        let pdf:ConvoCrawlerMedia|undefined;

        const outDir=await this.getOutDirAsync();

        const keepBrowserOpen=browser?true:false;
        if(!browser){
            browser=await this.createBrowserAsync();
        }
        try{

            if(!page){
                page=await browser.newPage();
            }

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

            const pdfBuffer=await page.pdf({
                timeout:2*60000
            });
            const name=`${setId}-pdf.pdf`
            pdf={
                path:`${this.options.id}/${name}`,
                url:`${this.options.httpAccessPoint}/${this.options.id}/${name}`,
                contentType:'application/pdf'
            }
            await writeFile(`${outDir}/${name}`,pdfBuffer);
            cancel?.throwIfCanceled();

            let completed=false;


            images=[];
            let i=0;
            let safeMode=false;
            while(true){

                if(i && !safeMode){
                    await hideFramesFixedAsync(page.frames());
                }
                await delayAsync(safeMode?2000:500);

                const actionItems=await getFramesActionItems(page.frames());

                const img=await page.screenshot();

                if(i && !safeMode){
                    await showFramesFixedAsync(page.frames());
                }
                cancel?.throwIfCanceled();

                const name=`${setId}-img-${i}`

                const imageMedia:ConvoCrawlerMedia={
                    path:`${this.options.id}/${name}.png`,
                    url:`${this.options.httpAccessPoint}/${this.options.id}/${name}.png`,
                    contentType:'image/png',
                    actionItems
                }

                images.push(imageMedia)
                await writeFile(`${outDir}/${name}.png`,img);
                await writeFile(`${outDir}/${name}.json`,JSON.stringify(actionItems,null,4));
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
                    completed=true;
                    break;
                }
            }

            cancel?.throwIfCanceled();

            await page.evaluate(()=>{
                const target=document.querySelector('html')??document.body;
                target.style.transform='';
            });

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
                completed,
            };

        }finally{

            if(!keepBrowserOpen){
                await browser.close();
            }

        }
    }
}
