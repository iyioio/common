import { ConvoWebCrawler } from "./ConvoWebCrawler";
import { getConvoCrawlerApiOptionsFromEnvAsync } from "./convo-web-crawler-lib";
import { writeConvoCrawlerIndexAsync } from "./convo-web-crawler-output-previewer-writer";
import { ConvoWebRoute, createConvoWebHandlerResult } from "./convo-web-routing";

export const convoWebRoutes:ConvoWebRoute[]=[

    {
        path:['/','index.html'],
        handler:async ({filePath})=>{
            return createConvoWebHandlerResult({
                html:await writeConvoCrawlerIndexAsync(filePath)
            })
        }
    },

    {
        path:'/health-check',
        handler:()=>'ok'
    },

    {
        method:'POST',
        path:'/api/capture',
        handler:async ({body})=>{
            const crawler=new ConvoWebCrawler(await getConvoCrawlerApiOptionsFromEnvAsync());
            return await crawler.capturePageAsync(body);
        }
    },

    {
        method:'POST',
        path:'/api/convert',
        handler:async ({body})=>{
            const crawler=new ConvoWebCrawler(await getConvoCrawlerApiOptionsFromEnvAsync());
            return await crawler.convertPageAsync(body);
        }
    },

    {
        method:'POST',
        path:'/api/research',
        handler:async ({body})=>{
            const crawler=new ConvoWebCrawler(await getConvoCrawlerApiOptionsFromEnvAsync());
            return await crawler.searchAndRunResearchAsync(body);
        }
    },

    {
        method:'GET',
        path:'/api/research',
        handler:async ()=>{
            const crawler=new ConvoWebCrawler(await getConvoCrawlerApiOptionsFromEnvAsync());
            return await crawler.getResearchDocumentsAsync(10);
        }
    },

]
